// Global type definitions
// NW.js types are provided by @types/nw.js package

import type { CalendarBlock } from './store/types';

// Extend NW.js types with custom properties used in the application
declare global {
  namespace NWJS_Helpers {
    interface win {
      window: {
        /**
         * Custom function defined in notification.html that receives block data
         * from the main window and displays it in the notification popup.
         * See notification.html line 56 where this function is defined and line 84 where it's attached to window.
         */
        setBlockData(data: CalendarBlock): void;
      };
    }
  }

  // Declare the global nw object
  // The types come from @types/nw.js
  const nw: {
    App: nw.App;
    Window: nw.Window;
    Menu: typeof nw.Menu;
    MenuItem: typeof nw.MenuItem;
    Clipboard: nw.Clipboard;
    Screen: nw.Screen;
    Shell: nw.Shell;
  };
}

// This export makes TypeScript treat this file as a module while still allowing global declarations
export {};
