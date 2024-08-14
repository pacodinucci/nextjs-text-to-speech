export async function POST(request: Request) {
  try {
    const requestBody = await request.json();

    if (!requestBody.modelUrl) {
      return new Response(
        JSON.stringify({
          error: "Missing 'modelUrl' field in the request body",
        }),
        { status: 400 }
      );
    }

    if (!requestBody.input) {
      return new Response(
        JSON.stringify({ error: "Missing 'input' field in the request body" }),
        { status: 400 }
      );
    }

    if (!process.env.HUGGING_FACE_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Missing 'Hugging Face Access Token'" }),
        { status: 500 }
      );
    }

    const modelUrl = requestBody.modelUrl;
    const input = requestBody.input;

    const response = await fetch(modelUrl, {
      headers: {
        Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ inputs: input }),
    });

    if (!response.ok) {
      const errorResponse = await response.json();

      if (errorResponse.error.includes("currently loading")) {
        const estimatedTime = errorResponse.estimated_time || "a few seconds";
        return new Response(
          JSON.stringify({
            error: "Model is currently loading",
            estimated_time: estimatedTime,
          }),
          { status: 503 }
        );
      }

      console.error(
        `Request to model failed: ${JSON.stringify(errorResponse)}`
      );
      return new Response(
        JSON.stringify({ error: "Request to the model failed" }),
        { status: response.status }
      );
    }

    const audioData = await response.arrayBuffer();

    return new Response(audioData, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("An error occurred:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
