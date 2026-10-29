// react-big-calendar only publishes types for its public entry point.
// Building a custom view (see src/components/TwoDayView.tsx) requires
// reaching into its internals, which have no type declarations.
declare module 'react-big-calendar/lib/TimeGrid';
