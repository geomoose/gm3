# Input types

GeoMoose offers a variety of inputs types to be used with services.
(See [Services and Actions](actions-and-services.md)) for more information
on services.  Each section describes a type of field and provides an example.

## All input types

All inputs require a `type` and a `name` field. The `type` provides the specific
control that needs to be rendered for the user and the `name` is how it will be
referred to in subsequent queries.

## type: text
Used to provide free-form text input from the user.

*Example:*

```javascript
{
  type: 'text',
  name: 'username',
  label: 'Username'
}
```
  
## type: select

Provides the user with a list of options from which they can choose.

*Example:*

```javascript
{
  type: 'select',
  name: 'flavor',
  default: 'orange',
  options: [
    {value: 'orange', label: 'Orange'},
    {value: 'lime', label: 'Lime'},
    {value: 'red', label: 'Red'}
  ]
}

```

## type: length

Give the user the ability to specify a length in any number of given units. The value
returned by this input is always in meters. Subsequent conversions may be necessary to
make that value useful.

## type: layers-list

Provide a list of layers matching a set of criterion.

*Example, all layers with either a select or select-header template:*

```javascript
{
  type: 'layers-list',
  name: 'layers',
  filter: {
    requireVisible: false,
    withTemplate: ['select', 'select-header']
  }
}
```

*Example, a set of pre-specified layer paths:*

```javascript
{
  type: 'layers-list',
  name: 'layers',
  filter: {
    layers: ['map-source0/layer0', 'map-source1/layer0', 'map-source1/layer1']
  }
}
```
   
