# message_services
message_services
# Payload data format

```json
{
  "UB": {
    "header": {
      "Version": "1",
      "Message_ID": "projectname.company_name.plugin_name.api_name"
    },
    "data_body": "request.data",
    "footer": {
      "Copyright": "Yoofoo",
      "Year": 2020
    }
  },
  "permission_type": "read",
  "map_url": "localhost:3000"
}
```