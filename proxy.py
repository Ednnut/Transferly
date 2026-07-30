import httpx
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse

app = FastAPI()

UPSTREAM = "https://api.agentrouter.com/v1"

@app.post("/{path:path}")
async def proxy(path: str, request: Request):
    body = await request.body()

    async with httpx.AsyncClient(timeout=None) as client:
        upstream_req = client.build_request(
            "POST",
            f"{UPSTREAM}/{path}",
            headers=request.headers,
            content=body,
        )

        upstream_resp = await client.send(upstream_req, stream=True)

        async def event_stream():
            async for chunk in upstream_resp.aiter_bytes():
                yield chunk

        return StreamingResponse(
            event_stream(),
            status_code=upstream_resp.status_code,
            media_type=upstream_resp.headers.get("content-type", "application/octet-stream")
        )
