import { NextRequest, NextResponse } from "next/server";
import ping from "ping";

export async function POST(request: NextRequest) {
    const { ip } = await request.json();

    if (!ip) {
        return NextResponse.json({ status: "error", message: "No IP provided" });
    }
    // check if valid ip address
    const ipRegex =
        /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ip.match(ipRegex)) {
        return NextResponse.json({ status: "error", message: "Invalid IP address" });
    }
    // check if ip is allowed
    const invalid_subnets = ["192.168", "10", "172", "127"];
    if (invalid_subnets.some((subnet) => ip.startsWith(subnet))) {
        return NextResponse.json({ status: "error", message: "Invalid IP address" });
    }

    const isAlive = await ping.promise.probe(ip, {
        timeout: 1,
    });

    if (isAlive.alive) {
        return NextResponse.json({ status: "alive", output: isAlive.output });
    }
    return NextResponse.json({ status: "error", output: isAlive.output });
}
