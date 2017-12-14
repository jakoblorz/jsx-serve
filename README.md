# jsx-serve

## Configuration
```yaml
defaults:
  port: 8585            # port to listen on
  host: "127.0.0.1"     # host to listen on
  mode: "non-strict"    # mode-switch: non-strict vs strict

handlers:               # list of the handler configurations
  - file: "/viewa.js"   # define for which handler the config is
    method: "POST"      # define the http-method to listen for this handler on
    alias: "/users/api" # reroute the handler to another url instead of the filesystem
```