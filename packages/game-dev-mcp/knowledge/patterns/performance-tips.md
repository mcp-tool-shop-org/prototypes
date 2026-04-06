---
title: "Performance Tips"
category: patterns
tags: [performance, batch, efficiency, optimization]
difficulty: intermediate
summary: "Optimizing your MCP workflow for speed and efficiency."
ueVersion: "5.4+"
---

## Batch Operations

Instead of individual property sets:
```
# Slow — 3 HTTP round-trips
ue_set_property(objectPath: actor1, propertyName: "X", value: 1)
ue_set_property(objectPath: actor2, propertyName: "X", value: 2)
ue_set_property(objectPath: actor3, propertyName: "X", value: 3)
```

Use batch:
```
# Fast — 1 HTTP round-trip
ue_batch_set_properties(operations: [
  {objectPath: actor1, propertyName: "X", value: 1},
  {objectPath: actor2, propertyName: "X", value: 2},
  {objectPath: actor3, propertyName: "X", value: 3}
])
```

## Minimize Describe Calls

`ue_describe_object` returns a lot of data. Cache the result mentally and reuse the property/function names rather than calling describe repeatedly.

## Use Search Efficiently

`ue_search_assets` with no filters searches everything — slow on large projects. Always provide:
- A specific `query` string
- A `classFilter` to narrow asset types
- A `pathFilter` to limit to relevant directories

## Save Strategically

`ue_save_all()` saves everything. For incremental work, use `ue_save_asset` for specific assets or `ue_save_current_level` for just the level.

## Actor Listing Performance

`ue_get_all_actors()` can return thousands of entries in complex levels. Use `classFilter` to narrow results:
```
ue_get_all_actors(classFilter: "PointLight")
```

## Connection Timeout

If operations are slow, increase the timeout:
```
GAMEDEV_MCP_TIMEOUT=30000
```

Default is 10 seconds, which is fine for most operations. Level loads and lighting builds may need more.
