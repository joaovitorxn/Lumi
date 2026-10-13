# THROWAWAY spike: read lamp state, toggle via cloud API, restore.
import json, os, time
import tinytuya
from dotenv import load_dotenv

load_dotenv()
c = tinytuya.Cloud(apiRegion=os.environ["TUYA_REGION"], apiKey=os.environ["TUYA_ACCESS_ID"], apiSecret=os.environ["TUYA_ACCESS_KEY"])
dev = json.load(open("devices.json", encoding="utf-8"))[0]["id"]
st = c.getstatus(dev)
print("status:", json.dumps(st.get("result"), ensure_ascii=False))
orig = next(x["value"] for x in st["result"] if x["code"] == "switch_led")
for val in (not orig, orig):
    r = c.sendcommand(dev, {"commands": [{"code": "switch_led", "value": val}]})
    print(f"set switch_led={val} ->", r.get("success"), r.get("msg"))
    time.sleep(2)
