# THROWAWAY spike: find the camera on the LAN and see if it exposes RTSP/ONVIF.
import socket, subprocess, sys, time, uuid
from concurrent.futures import ThreadPoolExecutor

SUBNET = sys.argv[1] if len(sys.argv) > 1 else "192.168.1."
PORTS = [554, 8554, 8000, 8080, 80, 443, 6668, 8899, 5000]


def probe(ip):
    open_ports = []
    for p in PORTS:
        s = socket.socket()
        s.settimeout(0.4)
        try:
            s.connect((ip, p))
            open_ports.append(p)
        except OSError:
            pass
        finally:
            s.close()
    return ip, open_ports


def arp_table():
    out = subprocess.run(["arp", "-a"], capture_output=True, text=True).stdout
    res = {}
    for line in out.splitlines():
        parts = line.split()
        if len(parts) >= 2 and parts[0].startswith(SUBNET):
            res[parts[0]] = parts[1]
    return res


def ws_discovery(timeout=4):
    msg = f"""<?xml version="1.0" encoding="UTF-8"?>
<e:Envelope xmlns:e="http://www.w3.org/2003/05/soap-envelope" xmlns:w="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:d="http://schemas.xmlsoap.org/ws/2005/04/discovery" xmlns:dn="http://www.onvif.org/ver10/network/wsdl"><e:Header><w:MessageID>uuid:{uuid.uuid4()}</w:MessageID><w:To>urn:schemas-xmlsoap-org:ws:2005:04:discovery</w:To><w:Action>http://schemas.xmlsoap.org/ws/2005/04/discovery/Probe</w:Action></e:Header><e:Body><d:Probe><d:Types>dn:NetworkVideoTransmitter</d:Types></d:Probe></e:Body></e:Envelope>"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(timeout)
    s.sendto(msg.encode(), ("239.255.255.250", 3702))
    found = []
    end = time.time() + timeout
    while time.time() < end:
        try:
            data, addr = s.recvfrom(65535)
            found.append((addr[0], data[:200]))
        except OSError:
            break
    return found


def tuya_broadcasts(seconds=15):
    """Tuya LAN devices broadcast on UDP 6666/6667 (payload encrypted; we only log sources)."""
    socks = []
    for port in (6666, 6667):
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(("", port))
        s.settimeout(0.5)
        socks.append((port, s))
    seen = {}
    end = time.time() + seconds
    while time.time() < end:
        for port, s in socks:
            try:
                data, addr = s.recvfrom(4096)
                seen.setdefault(addr[0], []).append((port, len(data)))
            except OSError:
                pass
    return seen


if __name__ == "__main__":
    print(f"[1/3] TCP probe {SUBNET}1-254 ports {PORTS}")
    with ThreadPoolExecutor(64) as ex:
        results = list(ex.map(probe, [f"{SUBNET}{i}" for i in range(1, 255)]))
    arp = arp_table()
    for ip, ports in results:
        if ports:
            print(f"  {ip:15} mac={arp.get(ip, '?'):18} open={ports}")
    print("  ARP-only hosts:", sorted(set(arp) - {ip for ip, p in results if p}))

    print("[2/3] ONVIF WS-Discovery")
    for ip, d in ws_discovery():
        print(f"  {ip}: {d!r}")

    print("[3/3] Tuya UDP broadcasts (15s)")
    for ip, hits in tuya_broadcasts().items():
        print(f"  {ip}: {len(hits)} pkts on ports {sorted({h[0] for h in hits})}")
