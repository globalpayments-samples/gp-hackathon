package com.globalpayments.sample;
{{ IMPORTS }}

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.stream.Collectors;

/**
 * {{ PROJECT_NAME }} — generated standalone sample project.
 * Composed by the Builder from the Global Payments component catalog.
 * Every route below is signal: one handler per selected component.
 * Config.java hides SDK setup; static files are served by Tomcat's default servlet.
 */
@WebServlet(urlPatterns = {"/api/*", "/health"})
public class SampleServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    @Override
    public void init() throws jakarta.servlet.ServletException {
        Config.configure();
    }

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response)
            throws jakarta.servlet.ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if ("OPTIONS".equals(request.getMethod())) {
            response.setStatus(200);
            return;
        }

        String method = request.getMethod();
        String uri = request.getRequestURI()
            .substring(request.getContextPath().length())
            .replaceAll("/+$", "");
        if (uri.isEmpty()) uri = "/";

        // Health check — no SDK required.
        if ("GET".equals(method) && "/health".equals(uri)) {
            response.getWriter().write("{\"status\":\"ok\"}");
            return;
        }

        {{ ROUTE_HANDLERS }}

        // 404 — no component handled this route.
        response.setStatus(404);
        response.getWriter().write(
            "{\"error\":{\"type\":\"NotFound\",\"message\":\"No route matched " + method + " " + uri + "\",\"status\":404}}");
    }
}
