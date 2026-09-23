--- === WillCalNow ===
---
--- Shows the title of the WillCal block covering the current instant in the mac
--- menubar, by polling `GET /now`.
---
--- `/now` is gated by the same signed session cookie as `/rpc`, so this Spoon
--- signs in once via `session.login` using the password passed to `start()`,
--- keeps the cookie in memory, and re-signs in whenever the server answers 401.
---
--- Download: https://github.com/wharding/willcal (hammerspoon/WillCalNow.spoon)

local obj = {}
obj.__index = obj

obj.name = "WillCalNow"
obj.version = "1.0"
obj.author = "Will Harding"
obj.license = "MIT"

--- WillCalNow.url
--- Variable
--- Base URL of the WillCal server. No trailing slash. Default
--- `"http://127.0.0.1:8080"`.
obj.url = "http://127.0.0.1:8080"

--- WillCalNow.interval
--- Variable
--- Seconds between polls of `/now`. Default 30, matching the web client's
--- notification poll. `minutesRemaining` only changes once a minute, so there
--- is little point going below 15.
obj.interval = 30

--- WillCalNow.password
--- Variable
--- The shared password (`WILLCAL_PASSWORD`). Required. Normally passed to
--- `start()` rather than assigned here.
obj.password = nil

--- WillCalNow.maxTitleLength
--- Variable
--- Longest block title shown in the menubar before it is elided. Default 28.
obj.maxTitleLength = 28

--- WillCalNow.showTimeRemaining
--- Variable
--- Append the time left on the block, e.g. `Write the report (36m)`. Default
--- true.
obj.showTimeRemaining = true

--- WillCalNow.warnMinutes
--- Variable
--- Draw the menubar text red once this many minutes remain. Default 5. Set to
--- 0 to never colour it.
obj.warnMinutes = 5

--- WillCalNow.idleTitle
--- Variable
--- Menubar text when nothing is scheduled over now. Default `"idle"`.
obj.idleTitle = "idle"

-- Runtime state. `cookie` is a Cookie header value, not a Set-Cookie one.
obj.menubar = nil
obj.timer = nil
obj.cookie = nil
obj.block = nil
obj.error = nil
obj.signingIn = false

local ELLIPSIS = "\u{2026}"

-- Case-insensitive header lookup: NSURLSession does not promise a particular
-- capitalisation.
local function headerValue(headers, name)
  if type(headers) ~= "table" then return nil end
  local want = name:lower()
  for key, value in pairs(headers) do
    if type(key) == "string" and key:lower() == want then return value end
  end
  return nil
end

-- Pulls the session token out of a Set-Cookie header. Several cookies may be
-- folded into one comma-separated value, so match the name rather than taking
-- the first pair. Returns nil for the empty value the logout cookie carries.
local function sessionCookie(setCookie)
  if type(setCookie) ~= "string" then return nil end
  local token = setCookie:match("willcal_session=([^;,%s]+)")
  if not token then return nil end
  return "willcal_session=" .. token
end

local function truncate(text, limit)
  local ok, length = pcall(function() return utf8.len(text) end)
  if not ok or not length then length = #text end
  if length <= limit then return text end
  local ok2, cut = pcall(function() return text:sub(1, utf8.offset(text, limit) - 1) end)
  if not ok2 or not cut then cut = text:sub(1, limit - 1) end
  return cut .. ELLIPSIS
end

local function humanMinutes(minutes)
  if minutes < 60 then return string.format("%dm", minutes) end
  local hours = math.floor(minutes / 60)
  local rest = minutes % 60
  if rest == 0 then return string.format("%dh", hours) end
  return string.format("%dh%02dm", hours, rest)
end

-- `/now` reports UTC instants; the menu shows local wall clock. os.time reads
-- its table as local time, so parse, then add the local offset at that moment.
local function isoToEpoch(iso)
  if type(iso) ~= "string" then return nil end
  local y, mo, d, h, mi, s = iso:match("(%d+)-(%d+)-(%d+)T(%d+):(%d+):(%d+)")
  if not y then return nil end
  local naive = os.time({
    year = tonumber(y), month = tonumber(mo), day = tonumber(d),
    hour = tonumber(h), min = tonumber(mi), sec = tonumber(s), isdst = false,
  })
  if not naive then return nil end
  local localParts = os.date("*t", naive)
  local utcParts = os.date("!*t", naive)
  utcParts.isdst = localParts.isdst
  return naive + os.difftime(os.time(localParts), os.time(utcParts))
end

local function clock(iso)
  local epoch = isoToEpoch(iso)
  if not epoch then return "?" end
  return (os.date("%I:%M %p", epoch):gsub("^0", ""))
end

--- WillCalNow:configure(options)
--- Method
--- Copies the given keys onto the Spoon. Sugar for assigning fields one at a
--- time; safe to call before or after `start()`.
---
--- Parameters:
---  * options - table of any of the variables documented above
---
--- Returns:
---  * The WillCalNow object
function obj:configure(options)
  for key, value in pairs(options or {}) do
    self[key] = value
  end
  if self.menubar then self:_render() end
  return self
end

function obj:init()
  return self
end

--- WillCalNow:start(options)
--- Method
--- Creates the menubar item and begins polling. Idempotent.
---
--- Parameters:
---  * options - optional table applied via `configure` first, e.g.
---    `{ password = "...", url = "http://127.0.0.1:8080" }`
---
--- Returns:
---  * The WillCalNow object
function obj:start(options)
  if options then self:configure(options) end
  if not self.menubar then
    self.menubar = hs.menubar.new()
    if not self.menubar then
      hs.printf("[%s] no room in the menubar", self.name)
      return self
    end
    self.menubar:setMenu(function() return self:_menu() end)
  end
  self:_render("WillCal" .. ELLIPSIS)
  if not self.timer then
    self.timer = hs.timer.doEvery(self.interval, function() self:refresh() end)
  end
  self:refresh()
  return self
end

--- WillCalNow:stop()
--- Method
--- Stops polling and removes the menubar item. The session cookie is dropped,
--- so the next `start()` signs in again.
---
--- Returns:
---  * The WillCalNow object
function obj:stop()
  if self.timer then
    self.timer:stop()
    self.timer = nil
  end
  if self.menubar then
    self.menubar:delete()
    self.menubar = nil
  end
  self.cookie = nil
  self.block = nil
  self.error = nil
  return self
end

--- WillCalNow:refresh()
--- Method
--- Fetches `/now` immediately, signing in first if there is no cookie yet.
---
--- Returns:
---  * The WillCalNow object
function obj:refresh()
  if self.cookie then
    self:_fetch(true)
  else
    self:_signIn(function(ok) if ok then self:_fetch(false) end end)
  end
  return self
end

--- WillCalNow:bindHotkeys(mapping)
--- Method
--- Binds hotkeys. Supported actions: `refresh` (poll now) and `open` (open the
--- web app).
---
--- Parameters:
---  * mapping - e.g. `{ refresh = { { "cmd", "alt" }, "n" } }`
---
--- Returns:
---  * The WillCalNow object
function obj:bindHotkeys(mapping)
  hs.spoons.bindHotkeysToSpec({
    refresh = hs.fnutils.partial(self.refresh, self),
    open = function() hs.urlevent.openURL(self.url) end,
  }, mapping)
  return self
end

-- Exchanges the password for a session cookie. `done(true)` on success.
-- Concurrent callers are dropped rather than queued: the poll comes round
-- again in `interval` seconds.
function obj:_signIn(done)
  if self.signingIn then return end

  if type(self.password) ~= "string" or self.password == "" then
    self:_fail("no password configured")
    if done then done(false) end
    return
  end

  local body = hs.json.encode({
    jsonrpc = "2.0", id = 1, method = "session.login",
    params = { password = self.password },
  })

  self.signingIn = true
  hs.http.asyncPost(self.url .. "/rpc", body, { ["Content-Type"] = "application/json" },
    function(status, responseBody, headers)
      self.signingIn = false

      if status ~= 200 then
        self:_fail(status < 0 and "server unreachable" or ("sign-in HTTP " .. status))
        if done then done(false) end
        return
      end

      local decoded = self:_decode(responseBody)
      if not decoded or decoded.error or not (decoded.result and decoded.result.authenticated) then
        local message = decoded and decoded.error and decoded.error.message or "sign-in rejected"
        self:_fail(message)
        if done then done(false) end
        return
      end

      local cookie = sessionCookie(headerValue(headers, "Set-Cookie"))
      if not cookie then
        self:_fail("no session cookie")
        if done then done(false) end
        return
      end

      self.cookie = cookie
      if done then done(true) end
    end)
end

-- One GET /now. `allowRetry` permits a single sign-in-and-retry on 401, which
-- is what a 30-day cookie expiring mid-session looks like.
function obj:_fetch(allowRetry)
  local headers = self.cookie and { Cookie = self.cookie } or {}

  hs.http.asyncGet(self.url .. "/now", headers, function(status, body)
    if status == 200 then
      local payload = self:_decode(body)
      if not payload then
        self:_fail("bad JSON from /now")
        return
      end
      -- `block` is all-or-nothing, and null during any gap in the schedule.
      self.block = payload.block
      self.error = nil
      self:_render()
      return
    end

    if status == 401 then
      self.cookie = nil
      if allowRetry then
        self:_signIn(function(ok) if ok then self:_fetch(false) end end)
      else
        self:_fail("not signed in")
      end
      return
    end

    self:_fail(status < 0 and "server unreachable" or ("/now HTTP " .. status))
  end)
end

function obj:_decode(body)
  local ok, decoded = pcall(hs.json.decode, body)
  if not ok or type(decoded) ~= "table" then return nil end
  return decoded
end

function obj:_fail(message)
  self.error = message
  self:_render()
end

function obj:_render(override)
  if not self.menubar then return end

  if override then
    self.menubar:setTitle(override)
    self.menubar:setTooltip("WillCal")
    return
  end

  if self.error then
    self.menubar:setTitle("WillCal ?")
    self.menubar:setTooltip("WillCal: " .. self.error)
    return
  end

  local block = self.block
  if not block then
    self.menubar:setTitle(self.idleTitle)
    self.menubar:setTooltip("Nothing scheduled")
    return
  end

  local name = block.name
  if type(name) ~= "string" or name == "" then name = "(untitled)" end
  local title = truncate(name, self.maxTitleLength)

  local remaining = tonumber(block.minutesRemaining)
  if self.showTimeRemaining and remaining then
    title = string.format("%s (%s)", title, humanMinutes(remaining))
  end

  if self.warnMinutes > 0 and remaining and remaining <= self.warnMinutes then
    self.menubar:setTitle(hs.styledtext.new(title, {
      color = { red = 0.85, green = 0.2, blue = 0.15, alpha = 1 },
      font = { name = ".AppleSystemUIFont", size = 13 },
    }))
  else
    self.menubar:setTitle(title)
  end

  local tooltip = name
  if block.calendar then tooltip = tooltip .. "\n" .. block.calendar end
  tooltip = tooltip .. "\n" .. clock(block.start) .. " to " .. clock(block["end"])
  self.menubar:setTooltip(tooltip)
end

function obj:_menu()
  local items = {}

  if self.error then
    items[#items + 1] = { title = self.error, disabled = true }
  elseif self.block then
    local block = self.block
    local name = (type(block.name) == "string" and block.name ~= "") and block.name or "(untitled)"
    items[#items + 1] = { title = name, disabled = true }
    if block.calendar then
      items[#items + 1] = { title = "    " .. block.calendar, disabled = true }
    end
    local span = clock(block.start) .. " to " .. clock(block["end"])
    local remaining = tonumber(block.minutesRemaining)
    if remaining then span = span .. "  (" .. humanMinutes(remaining) .. " left)" end
    items[#items + 1] = { title = "    " .. span, disabled = true }
  else
    items[#items + 1] = { title = "Nothing scheduled", disabled = true }
  end

  items[#items + 1] = { title = "-" }
  items[#items + 1] = { title = "Refresh", fn = function() self:refresh() end }
  items[#items + 1] = {
    title = "Copy title",
    disabled = self.block == nil,
    fn = function()
      if self.block then hs.pasteboard.setContents(self.block.name or "") end
    end,
  }
  items[#items + 1] = { title = "Open WillCal", fn = function() hs.urlevent.openURL(self.url) end }
  items[#items + 1] = { title = "-" }
  items[#items + 1] = {
    title = self.timer and "Pause updates" or "Resume updates",
    fn = function()
      if self.timer then
        self.timer:stop()
        self.timer = nil
        self:_render("WillCal (paused)")
      else
        self.timer = hs.timer.doEvery(self.interval, function() self:refresh() end)
        self:refresh()
      end
    end,
  }

  return items
end

return obj
