// If using the default settings for @babel/react-preset then
//  keeping the names React and ReactDOM are important.
const HelloWorldComponent = ({React, ReactDOM, store}) => (
    <div>
        This application has { Object.keys(store.getState().mapSources).length } map sources.
    </div>
);
