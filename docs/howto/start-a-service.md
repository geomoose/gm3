# How-to start a service (even at startup)

At times it is useful to have a service  be the first thing a user sees
when the application loads.

To start a service, dispatch the start service action! This example will
start the identify service:

```javascript
app.startService('identify');
```

Adding the above code at the end of the `app.loadMapbook` function will
have the effect of starting the service at startup.
