import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AI Business Intelligence Platform API",
      version: "1.0.0",
      description: "Multi-agent BI platform — Planner → Data → Investigator → Visualizer → Reporter",
    },
    servers: [{ url: "http://localhost:4000", description: "Local" }],
    components: {
      securitySchemes: {
        cookieAuth: { type: "apiKey", in: "cookie", name: "token" },
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        // ── Enums ────────────────────────────────────────────────
        UserRole:          { type: "string", enum: ["admin", "analyst", "viewer"] },
        AnalysisStatus:    { type: "string", enum: ["pending", "running", "done", "failed"] },
        WorkflowStatus:    { type: "string", enum: ["running", "success", "failed", "cancelled", "skipped"] },
        TriggerType:       { type: "string", enum: ["schedule", "event", "manual"] },
        OutputType:        { type: "string", enum: ["email", "slack", "dashboard", "pdf", "webhook", "none"] },
        AgentName:         { type: "string", enum: ["planner", "data_agent", "investigator", "visualizer", "reporter"] },
        StepStatus:        { type: "string", enum: ["pending", "running", "success", "failed", "skipped"] },
        RiskLevel:         { type: "string", enum: ["low", "medium", "high", "critical"] },
        ChartType:         { type: "string", enum: ["bar", "line", "pie", "heatmap", "scatter", "kpi_card", "table", "area"] },

        // ── Shared ───────────────────────────────────────────────
        ApiError: {
          type: "object",
          properties: {
            success:    { type: "boolean", example: false },
            statusCode: { type: "integer", example: 400 },
            message:    { type: "string",  example: "Validation error" },
          },
        },

        // ── User ─────────────────────────────────────────────────
        User: {
          type: "object",
          properties: {
            id:           { type: "string", format: "uuid" },
            email:        { type: "string", format: "email" },
            name:         { type: "string" },
            role:         { $ref: "#/components/schemas/UserRole" },
            notify_email: { type: "boolean" },
            is_active:    { type: "boolean" },
            created_at:   { type: "string", format: "date-time" },
          },
        },
        RegisterBody: {
          type: "object",
          required: ["email", "name", "password"],
          properties: {
            email:    { type: "string", format: "email",   example: "admin@biplatform.com" },
            name:     { type: "string",                    example: "Shahzaib Khan" },
            password: { type: "string", minLength: 8,      example: "StrongPass123!" },
            role:     { $ref: "#/components/schemas/UserRole" },
          },
        },
        LoginBody: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email:    { type: "string", format: "email", example: "admin@biplatform.com" },
            password: { type: "string",                  example: "StrongPass123!" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
            user:  { $ref: "#/components/schemas/User" },
          },
        },
        ChangePasswordBody: {
          type: "object",
          required: ["current_password", "new_password"],
          properties: {
            current_password: { type: "string" },
            new_password:     { type: "string", minLength: 8 },
          },
        },

        // ── Analysis ─────────────────────────────────────────────
        AnalysisPlan: {
          type: "object",
          properties: {
            goal:         { type: "string",                    example: "Find why Q2 sales dropped" },
            steps:        { type: "array", items: { type: "string" }, example: ["load_sales", "find_anomalies"] },
            data_sources: { type: "array", items: { type: "string" }, example: ["events", "metrics"] },
            time_range: {
              type: "object",
              properties: {
                from: { type: "string", format: "date", example: "2024-04-01" },
                to:   { type: "string", format: "date", example: "2024-06-30" },
              },
            },
            filters: { type: "object", additionalProperties: { type: "string" } },
          },
        },
        Anomaly: {
          type: "object",
          properties: {
            field:       { type: "string",  example: "revenue" },
            value:       { type: "number",  example: 1200 },
            zscore:      { type: "number",  example: -3.2 },
            description: { type: "string",  example: "Revenue dropped 3.2 std deviations below mean" },
          },
        },
        Trend: {
          type: "object",
          properties: {
            direction:   { type: "string",  enum: ["up", "down", "flat"] },
            magnitude:   { type: "number",  example: 0.30 },
            period:      { type: "string",  example: "Q2-2024" },
            description: { type: "string",  example: "30% revenue decline vs Q1" },
          },
        },
        Correlation: {
          type: "object",
          properties: {
            field_a:        { type: "string", example: "support_tickets" },
            field_b:        { type: "string", example: "churn" },
            correlation:    { type: "number", example: 0.87 },
            interpretation: { type: "string", example: "High ticket volume strongly predicts churn" },
          },
        },
        Findings: {
          type: "object",
          properties: {
            summary:          { type: "string" },
            anomalies:        { type: "array", items: { $ref: "#/components/schemas/Anomaly" } },
            trends:           { type: "array", items: { $ref: "#/components/schemas/Trend" } },
            correlations:     { type: "array", items: { $ref: "#/components/schemas/Correlation" } },
            top_drivers:      { type: "array", items: { type: "string" } },
            risk_level:       { $ref: "#/components/schemas/RiskLevel" },
            confidence_score: { type: "number", example: 0.87 },
          },
        },
        ChartConfig: {
          type: "object",
          properties: {
            type:         { $ref: "#/components/schemas/ChartType" },
            title:        { type: "string" },
            description:  { type: "string" },
            labels:       { type: "array", items: { type: "string" } },
            values:       { type: "array", items: { type: "number" } },
            series: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  data: { type: "array", items: { type: "number" } },
                },
              },
            },
            x_axis_label:  { type: "string" },
            y_axis_label:  { type: "string" },
            color_scheme:  { type: "string", enum: ["blue", "red", "green", "orange", "purple", "multi"] },
            kpi_value:     { type: "string",  example: "-30%" },
            kpi_trend:     { type: "string",  enum: ["up", "down", "flat"] },
            kpi_change:    { type: "string",  example: "vs Q1 2024" },
          },
        },
        NextAction: {
          type: "object",
          properties: {
            action:   { type: "string" },
            owner:    { type: "string" },
            priority: { type: "string", enum: ["high", "medium", "low"] },
            deadline: { type: "string", format: "date" },
          },
        },
        Report: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            root_causes:       { type: "array", items: { type: "string" } },
            key_findings:      { type: "array", items: { type: "string" } },
            recommendations:   { type: "array", items: { type: "string" } },
            next_actions:      { type: "array", items: { $ref: "#/components/schemas/NextAction" } },
            confidence_score:  { type: "number" },
            risk_level:        { $ref: "#/components/schemas/RiskLevel" },
          },
        },
        Analysis: {
          type: "object",
          properties: {
            id:          { type: "string", format: "uuid" },
            question:    { type: "string" },
            status:      { $ref: "#/components/schemas/AnalysisStatus" },
            plan:        { $ref: "#/components/schemas/AnalysisPlan" },
            findings:    { $ref: "#/components/schemas/Findings" },
            charts:      { type: "array", items: { $ref: "#/components/schemas/ChartConfig" } },
            report:      { $ref: "#/components/schemas/Report" },
            error:       { type: "string", nullable: true },
            started_at:  { type: "string", format: "date-time", nullable: true },
            finished_at: { type: "string", format: "date-time", nullable: true },
            created_at:  { type: "string", format: "date-time" },
          },
        },
        AnalysisSummary: {
          type: "object",
          properties: {
            id:          { type: "string", format: "uuid" },
            question:    { type: "string" },
            status:      { $ref: "#/components/schemas/AnalysisStatus" },
            error:       { type: "string", nullable: true },
            started_at:  { type: "string", format: "date-time", nullable: true },
            finished_at: { type: "string", format: "date-time", nullable: true },
            created_at:  { type: "string", format: "date-time" },
          },
        },
        CreateAnalysisBody: {
          type: "object",
          required: ["question"],
          properties: {
            question: {
              type: "string",
              minLength: 5,
              maxLength: 1000,
              example: "Why did our sales drop in Q2 2024?",
            },
          },
        },

        // ── Workflow ──────────────────────────────────────────────
        WorkflowStep: {
          type: "object",
          required: ["order", "agent", "task"],
          properties: {
            order:  { type: "integer", minimum: 1, example: 1 },
            agent:  { $ref: "#/components/schemas/AgentName" },
            task:   { type: "string", example: "load_sales" },
            config: { type: "object", additionalProperties: true },
          },
        },
        TriggerConfig: {
          type: "object",
          properties: {
            cron:       { type: "string", example: "0 9 * * *" },
            timezone:   { type: "string", example: "Asia/Karachi" },
            event_type: { type: "string", example: "churn" },
            threshold:  { type: "number", example: 0.05 },
          },
        },
        OutputConfig: {
          type: "object",
          properties: {
            to:      { type: "array", items: { type: "string", format: "email" } },
            subject: { type: "string" },
            webhook: { type: "string", format: "uri" },
            channel: { type: "string" },
          },
        },
        Workflow: {
          type: "object",
          properties: {
            id:             { type: "string", format: "uuid" },
            name:           { type: "string" },
            description:    { type: "string", nullable: true },
            trigger_type:   { $ref: "#/components/schemas/TriggerType" },
            trigger_config: { $ref: "#/components/schemas/TriggerConfig" },
            steps:          { type: "array", items: { $ref: "#/components/schemas/WorkflowStep" } },
            output_type:    { $ref: "#/components/schemas/OutputType" },
            output_config:  { $ref: "#/components/schemas/OutputConfig" },
            is_active:      { type: "boolean" },
            last_run:       { type: "string", format: "date-time", nullable: true },
            next_run:       { type: "string", format: "date-time", nullable: true },
            created_at:     { type: "string", format: "date-time" },
            updated_at:     { type: "string", format: "date-time" },
          },
        },
        CreateWorkflowBody: {
          type: "object",
          required: ["name", "trigger_type", "trigger_config", "steps"],
          properties: {
            name:           { type: "string", minLength: 2, maxLength: 200, example: "Daily Sales Report" },
            description:    { type: "string", example: "Runs every morning at 9am PKT" },
            trigger_type:   { $ref: "#/components/schemas/TriggerType" },
            trigger_config: { $ref: "#/components/schemas/TriggerConfig" },
            steps:          { type: "array", items: { $ref: "#/components/schemas/WorkflowStep" }, minItems: 1 },
            output_type:    { $ref: "#/components/schemas/OutputType" },
            output_config:  { $ref: "#/components/schemas/OutputConfig" },
          },
        },
        StepResult: {
          type: "object",
          properties: {
            id:          { type: "string", format: "uuid" },
            run_id:      { type: "string", format: "uuid" },
            step_order:  { type: "integer" },
            agent:       { $ref: "#/components/schemas/AgentName" },
            input:       { type: "object" },
            output:      { type: "object" },
            duration_ms: { type: "integer", nullable: true },
            status:      { $ref: "#/components/schemas/StepStatus" },
            error:       { type: "string", nullable: true },
            created_at:  { type: "string", format: "date-time" },
          },
        },
        WorkflowRun: {
          type: "object",
          properties: {
            id:           { type: "string", format: "uuid" },
            workflow_id:  { type: "string", format: "uuid" },
            status:       { $ref: "#/components/schemas/WorkflowStatus" },
            triggered_by: { $ref: "#/components/schemas/TriggerType" },
            started_at:   { type: "string", format: "date-time" },
            finished_at:  { type: "string", format: "date-time", nullable: true },
            result:       { type: "object", nullable: true },
            error:        { type: "string", nullable: true },
            step_results: { type: "array", items: { $ref: "#/components/schemas/StepResult" } },
          },
        },

        // ── Admin ─────────────────────────────────────────────────
        PlatformStats: {
          type: "object",
          properties: {
            totalUsers:     { type: "integer" },
            totalAnalyses:  { type: "integer" },
            totalWorkflows: { type: "integer" },
            recentRuns:     { type: "integer" },
            analysesByStatus: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  status: { $ref: "#/components/schemas/AnalysisStatus" },
                  _count: { type: "object", properties: { status: { type: "integer" } } },
                },
              },
            },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }, { bearerAuth: [] }],

    // ════════════════════════════════════════════════════════════
    // PATHS
    // ════════════════════════════════════════════════════════════
    paths: {

      // ── AUTH ──────────────────────────────────────────────────
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          security: [],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterBody" } } },
          },
          responses: {
            201: {
              description: "User registered",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success:    { type: "boolean", example: true },
                      statusCode: { type: "integer", example: 201 },
                      message:    { type: "string",  example: "Registered successfully" },
                      data: {
                        type: "object",
                        properties: {
                          user:  { $ref: "#/components/schemas/User" },
                          token: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            409: { description: "Email already registered", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
            422: { description: "Validation error",         content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          },
        },
      },

      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          security: [],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoginBody" } } },
          },
          responses: {
            200: {
              description: "Login successful — sets httpOnly cookie",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data:    { $ref: "#/components/schemas/LoginResponse" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            401: { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          },
        },
      },

      "/api/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout — clears cookie",
          responses: {
            200: { description: "Logged out" },
            401: { description: "Not authenticated" },
          },
        },
      },

      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current user profile",
          responses: {
            200: {
              description: "Profile fetched",
              content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/User" } } } } },
            },
            401: { description: "Not authenticated" },
          },
        },
        patch: {
          tags: ["Auth"],
          summary: "Update current user profile",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name:         { type: "string" },
                    notify_email: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Profile updated" },
            401: { description: "Not authenticated" },
          },
        },
      },

      "/api/auth/change-password": {
        patch: {
          tags: ["Auth"],
          summary: "Change password",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/ChangePasswordBody" } } },
          },
          responses: {
            200: { description: "Password changed" },
            400: { description: "Current password incorrect" },
            401: { description: "Not authenticated" },
          },
        },
      },

      // ── ANALYSIS ──────────────────────────────────────────────
      "/api/analysis": {
        post: {
          tags: ["Analysis"],
          summary: "Submit a plain-English question — starts 5-agent pipeline",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/CreateAnalysisBody" } } },
          },
          responses: {
            202: {
              description: "Analysis queued — poll /api/analysis/:id/status",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          analysis_id: { type: "string", format: "uuid" },
                          status:      { type: "string", example: "pending" },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: "Not authenticated" },
            422: { description: "Validation error" },
          },
        },
        get: {
          tags: ["Analysis"],
          summary: "List all analyses for current user",
          parameters: [
            { name: "page",  in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          ],
          responses: {
            200: {
              description: "Analyses listed",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          analyses: { type: "array", items: { $ref: "#/components/schemas/AnalysisSummary" } },
                          total:    { type: "integer" },
                          page:     { type: "integer" },
                          limit:    { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/api/analysis/search": {
        post: {
          tags: ["Analysis"],
          summary: "Semantic search over past analyses using vector embeddings",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["query"],
                  properties: { query: { type: "string", example: "why did revenue drop" } },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Matching analyses",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/AnalysisSummary" } } } },
                },
              },
            },
          },
        },
      },

      "/api/analysis/webhook": {
        post: {
          tags: ["Analysis"],
          summary: "Submit a question — fetches live data from a free public webhook API, then runs 5-agent pipeline",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["question"],
                  properties: {
                    question: { type: "string", example: "Are API errors trending up this week?" },
                    data_source_id: {
                      type: "string",
                      format: "uuid",
                      description: "Optional — defaults to Analytics Metrics API",
                      example: "b0000000-0000-0000-0000-000000000004",
                    },
                  },
                },
              },
            },
          },
          responses: {
            202: {
              description: "Webhook analysis queued — poll /api/analysis/:id/status",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          analysis_id: { type: "string", format: "uuid" },
                          status: { type: "string", example: "pending" },
                          source: { type: "string", example: "webhook" },
                          data_source_id: { type: "string", format: "uuid" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/api/analysis/webhook/sources": {
        get: {
          tags: ["Analysis"],
          summary: "List available webhook/API data sources (free public dummy APIs)",
          responses: {
            200: {
              description: "Active webhook data sources",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string", format: "uuid" },
                            name: { type: "string" },
                            type: { type: "string", example: "api" },
                            connection_config: { type: "object" },
                            last_synced: { type: "string", format: "date-time" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/api/analysis/{id}": {
        get: {
          tags: ["Analysis"],
          summary: "Get full analysis result including all agent outputs",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            200: {
              description: "Full analysis with plan, findings, charts, report",
              content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Analysis" } } } } },
            },
            404: { description: "Not found" },
          },
        },
        delete: {
          tags: ["Analysis"],
          summary: "Delete an analysis (owner or admin only)",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            200: { description: "Deleted" },
            403: { description: "Forbidden" },
            404: { description: "Not found" },
          },
        },
      },

      "/api/analysis/{id}/status": {
        get: {
          tags: ["Analysis"],
          summary: "Lightweight status poll — call every 2s until status = done",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            200: {
              description: "Status",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          id:          { type: "string", format: "uuid" },
                          status:      { $ref: "#/components/schemas/AnalysisStatus" },
                          error:       { type: "string", nullable: true },
                          started_at:  { type: "string", format: "date-time", nullable: true },
                          finished_at: { type: "string", format: "date-time", nullable: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ── WORKFLOWS ─────────────────────────────────────────────
      "/api/workflows": {
        post: {
          tags: ["Workflows"],
          summary: "Create a new workflow",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/CreateWorkflowBody" } } },
          },
          responses: {
            201: { description: "Workflow created", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Workflow" } } } } } },
            422: { description: "Validation error" },
          },
        },
        get: {
          tags: ["Workflows"],
          summary: "List workflows (admin sees all, others see own)",
          responses: {
            200: {
              description: "Workflows listed",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Workflow" } } } },
                },
              },
            },
          },
        },
      },

      "/api/workflows/{id}": {
        get: {
          tags: ["Workflows"],
          summary: "Get workflow with last 10 runs",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            200: { description: "Workflow detail" },
            404: { description: "Not found" },
          },
        },
        patch: {
          tags: ["Workflows"],
          summary: "Update workflow",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            content: { "application/json": { schema: { $ref: "#/components/schemas/CreateWorkflowBody" } } },
          },
          responses: {
            200: { description: "Updated" },
            404: { description: "Not found" },
          },
        },
        delete: {
          tags: ["Workflows"],
          summary: "Delete workflow — admin/analyst only",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            200: { description: "Deleted" },
            403: { description: "Forbidden" },
          },
        },
      },

      "/api/workflows/{id}/run": {
        post: {
          tags: ["Workflows"],
          summary: "Manually trigger a workflow run — admin/analyst only",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            202: {
              description: "Run queued",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { data: { type: "object", properties: { run_id: { type: "string", format: "uuid" } } } } },
                },
              },
            },
            400: { description: "Workflow inactive" },
            403: { description: "Forbidden" },
          },
        },
      },

      "/api/workflows/{id}/runs": {
        get: {
          tags: ["Workflows"],
          summary: "List runs for a workflow",
          parameters: [
            { name: "id",    in: "path",  required: true, schema: { type: "string", format: "uuid" } },
            { name: "page",  in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          ],
          responses: {
            200: {
              description: "Runs listed",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          runs:  { type: "array", items: { $ref: "#/components/schemas/WorkflowRun" } },
                          total: { type: "integer" },
                          page:  { type: "integer" },
                          limit: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },

      "/api/workflows/runs/{runId}": {
        get: {
          tags: ["Workflows"],
          summary: "Get a single run with all step results",
          parameters: [{ name: "runId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            200: { description: "Run detail", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/WorkflowRun" } } } } } },
            404: { description: "Not found" },
          },
        },
      },

      // ── ADMIN ─────────────────────────────────────────────────
      "/api/admin/users": {
        get: {
          tags: ["Admin"],
          summary: "List all users — admin only",
          responses: {
            200: {
              description: "Users listed",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/User" } } } },
                },
              },
            },
            403: { description: "Forbidden" },
          },
        },
      },

      "/api/admin/users/{id}": {
        patch: {
          tags: ["Admin"],
          summary: "Update user role / active status — admin only",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    role:         { $ref: "#/components/schemas/UserRole" },
                    is_active:    { type: "boolean" },
                    notify_email: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "User updated" },
            403: { description: "Forbidden" },
            404: { description: "Not found" },
          },
        },
      },

      "/api/admin/stats": {
        get: {
          tags: ["Admin"],
          summary: "Platform-wide stats — admin only",
          responses: {
            200: {
              description: "Stats",
              content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/PlatformStats" } } } } },
            },
            403: { description: "Forbidden" },
          },
        },
      },

      "/health": {
        get: {
          tags: ["Health"],
          summary: "Server health check",
          security: [],
          responses: {
            200: {
              description: "OK",
              content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", example: "ok" }, ts: { type: "string", format: "date-time" } } } } },
            },
          },
        },
      },
    },
  },
  apis: [],
});