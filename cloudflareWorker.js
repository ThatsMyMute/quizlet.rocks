addEventListener("fetch", (event) => {
    event.respondWith(fetchAndApply(event.request));
  });
  
  async function fetchAndApply(request) {
    const origin =
      request.headers.get("Origin") === null
        ? "null"
        : request.headers.get("Origin");
    if (!["https://quizlet.rocks", "http://127.0.0.1:8080", "http://127.0.0.1:5500", "null"].includes(origin))
      return new Response(
        JSON.stringify({
          error: "NOT_IN_WHITELIST",
          message: "Origin not in whitelist",
          origin,
        }),
        { headers: { "Access-Control-Allow-Origin": "*" } }
      );
    let response = null;
    let url = new URL(request.url);
    let url_hostname = url.hostname;
    url.protocol = "https:";
    url.host = "quizlet.com";
    url.pathname = "/" + url.pathname;
    let method = request.method;
    let request_headers = request.headers;
    let new_request_headers = new Headers(request_headers);
    let request_content_type = new_request_headers.get("content-type");
    new_request_headers.set("Host", "quizlet.com");
    new_request_headers.set("Origin", "quizlet.com");
    new_request_headers.set("Referer", url.protocol + "//" + url_hostname);
    var params = {
      method: method,
      headers: new_request_headers,
      redirect: "manual",
    };
    if (method.toUpperCase() === "POST" && request_content_type) {
      let request_content_type_toLower = request_content_type.toLowerCase();
      if (
        request_content_type_toLower.includes(
          "application/x-www-form-urlencoded"
        ) ||
        request_content_type_toLower.includes("multipart/form-data") ||
        request_content_type_toLower.includes("application/json")
      ) {
        let reqText = await request.text();
        if (reqText) {
          params.body = reqText;
        }
      }
    }
    let original_response = await fetch(url.href, params);
    connection_upgrade = new_request_headers.get("Upgrade");
    if (connection_upgrade && connection_upgrade.toLowerCase() == "websocket") {
      return original_response;
    }
    let original_response_clone = original_response.clone();
    let response_headers = original_response_clone.headers;
    let response_status = original_response_clone.status;
    let original_text = null;
    let new_response_headers = new Headers(response_headers);
    let new_response_status = response_status;
    const http_response_headers_set = {
      "X-Frame-Options": "ALLOW FROM https://quizlet.com",
      "Content-Security-Policy": "frame-ancestors 'self' https://quizlet.com;",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Credentials": true,
    };
    if(origin !== "null") http_response_headers_set["Access-Control-Allow-Origin"] = origin;
    for (let k in http_response_headers_set) {
      var v = http_response_headers_set[k];
      new_response_headers.set(k, v);
    }
    const http_response_headers_delete = [
      "Content-Security-Policy-Report-Only",
      "Clear-Site-Data",
    ];
    for (let k of http_response_headers_delete) {
      new_response_headers.delete(k);
    }
    if (new_response_headers.get("x-pjax-url")) {
      new_response_headers.set(
        "x-pjax-url",
        new_response_headers
          .get("x-pjax-url")
          .replace(url.protocol + "//", "https://")
          .replace("quizlet.com", url_hostname)
      );
    }
    if (new_response_headers.get("location")) {
      var location = new_response_headers.get("location");
      new_response_headers.set(
        "location",
        location
          .replace(url.protocol + "//", "https://")
          .replace("quizlet.com", url_hostname)
      );
    }
    if (new_response_headers.has("set-cookie")) {
      var firstCookie = new_response_headers.get("set-cookie").split(",").shift();
      new_response_headers.set(
        "set-cookie",
        firstCookie
          .split("SameSite=Lax; Secure")
          .join("")
          .split("SameSite=Lax")
          .join("")
          .split("SameSite=Strict; Secure")
          .join("")
          .split("SameSite=Strict")
          .join("")
          .split("SameSite=None; Secure")
          .join("")
          .split("SameSite=None")
          .join("")
          .replace(/^;+$/g, "") + "; SameSite=None; Secure"
      );
    }
    let response_content_type = new_response_headers.get("content-type");
    if (
      response_content_type &&
      response_content_type.toLowerCase().includes("text/html")
    ) {
      original_text = await replace_response_text(
        original_response_clone,
        "quizlet.com",
        url_hostname
      );
    } else {
      original_text = original_response_clone.body;
    }
    response = new Response(original_text, {
      status: new_response_status,
      headers: new_response_headers,
    });
    return response;
  }
  async function replace_response_text(response, upstream, host_name) {
    let text = await response.text();
    const replacement_rules = {
      "http://{upstream_hostname}/": "https://{proxy_hostname}/",
      "{upstream_hostname}": "{proxy_hostname}",
    };
    for (let k in replacement_rules) {
      var v = replacement_rules[k];
      k = k.replace(/{upstream_hostname}/g, upstream);
      k = k.replace(/{proxy_hostname}/g, host_name);
      v = v.replace(/{upstream_hostname}/g, upstream);
      v = v.replace(/{proxy_hostname}/g, host_name);
      text = text.replace(new RegExp(k, "g"), v);
    }
    return text;
  }
  