# THROWAWAY spike: list devices linked to the Tuya IoT project. Secrets never printed.
import json, os
import tinytuya
from dotenv import load_dotenv

load_dotenv()
cloud = tinytuya.Cloud(
    apiRegion=os.environ["TUYA_REGION"],
    apiKey=os.environ["TUYA_ACCESS_ID"],
    apiSecret=os.environ["TUYA_ACCESS_KEY"],
)

res = cloud.cloudrequest("/v1.0/iot-01/associated-users/devices")
print("success:", res.get("success"), "| code:", res.get("code"), "| msg:", res.get("msg"))
devices = (res.get("result") or {}).get("devices", [])
print(f"{len(devices)} device(s)")
for d in devices:
    print(f"  {d.get('name')!r:30} id={d.get('id')} cat={d.get('category')} "
          f"online={d.get('online')} ip={d.get('ip')} product={d.get('product_name')}")

# local_key is a secret: keep it in a local file only.
with open("devices.json", "w", encoding="utf-8") as f:
    json.dump(devices, f, indent=2, ensure_ascii=False)
