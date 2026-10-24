const fs = require('fs');
const path = require('path');

const collection = {
  info: {
    _postman_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Lab 11 — Veritas AI (Auditoría de Integridad Académica y Detección de IA)",
    description: "Colección automatizada del Laboratorio 11 para Veritas AI: Persistencia PostgreSQL en Supabase con TLS, Autenticación JWT, RBAC, Control BOLA/IDOR, e Integridad Referencial.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5000", type: "string" },
    { key: "apiKey", value: "61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0", type: "string" },
    { key: "adminEmail", value: "admin@veritas.ai", type: "string" },
    { key: "adminPassword", value: "SANTOTO_2026--2", type: "string" },
    { key: "tokenAdmin", value: "", type: "string" },
    { key: "tokenEstudiante", value: "", type: "string" },
    { key: "timestamp", value: "1", type: "string" },
    { key: "departamentoId", value: "1", type: "string" },
    { key: "docenteId", value: "1", type: "string" },
    { key: "estudianteId", value: "1", type: "string" },
    { key: "revisionId", value: "1", type: "string" },
    { key: "fechaRevision", value: "2027-11-15", type: "string" },
    { key: "horaRevision", value: "09:30:00", type: "string" },
    // Alias de retrocompatibilidad
    { key: "tokenPaciente", value: "", type: "string" },
    { key: "especialidadId", value: "1", type: "string" },
    { key: "medicoId", value: "1", type: "string" },
    { key: "pacienteId", value: "1", type: "string" },
    { key: "citaId", value: "1", type: "string" },
    { key: "fechaCita", value: "2027-11-15", type: "string" },
    { key: "horaCita", value: "09:30:00", type: "string" }
  ],
  item: [
    {
      name: "Bloque A: Autenticación y Perfil Académico",
      item: [
        {
          name: "1. Login Administrador Veritas AI (200 OK)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 200 OK', function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "var res = pm.response.json();",
                  "if (res.token) {",
                  "    pm.environment.set('tokenAdmin', res.token);",
                  "    pm.collectionVariables.set('tokenAdmin', res.token);",
                  "}"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "X-API-Key", value: "{{apiKey}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({ email: "{{adminEmail}}", password: "{{adminPassword}}" }, null, 2)
            },
            url: { raw: "{{baseUrl}}/api/auth/login", host: ["{{baseUrl}}"], path: ["api", "auth", "login"] }
          }
        },
        {
          name: "2. Login Contraseña Errónea (401 Unauthorized)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 401 Unauthorized', function () {",
                  "    pm.response.to.have.status(401);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "X-API-Key", value: "{{apiKey}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({ email: "{{adminEmail}}", password: "MAL" }, null, 2)
            },
            url: { raw: "{{baseUrl}}/api/auth/login", host: ["{{baseUrl}}"], path: ["api", "auth", "login"] }
          }
        },
        {
          name: "3. Registro de Estudiante / Autor (201 Created)",
          event: [
            {
              listen: "prerequest",
              script: {
                exec: [
                  "var ts = Date.now();",
                  "pm.environment.set('timestamp', ts);",
                  "pm.collectionVariables.set('timestamp', ts);",
                  "var day = String((ts % 25) + 1).padStart(2, '0');",
                  "var hour = String((Math.floor(ts / 1000) % 10) + 8).padStart(2, '0');",
                  "var min = String(Math.floor(ts / 100) % 60).padStart(2, '0');",
                  "var f = '2027-11-' + day;",
                  "var h = hour + ':' + min + ':00';",
                  "pm.environment.set('fechaRevision', f);",
                  "pm.collectionVariables.set('fechaRevision', f);",
                  "pm.environment.set('horaRevision', h);",
                  "pm.collectionVariables.set('horaRevision', h);",
                  "pm.environment.set('fechaCita', f);",
                  "pm.collectionVariables.set('fechaCita', f);",
                  "pm.environment.set('horaCita', h);",
                  "pm.collectionVariables.set('horaCita', h);"
                ],
                type: "text/javascript"
              }
            },
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 201 Created', function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "var res = pm.response.json();",
                  "if (res.token) {",
                  "    pm.environment.set('tokenEstudiante', res.token);",
                  "    pm.collectionVariables.set('tokenEstudiante', res.token);",
                  "    pm.environment.set('tokenPaciente', res.token);",
                  "    pm.collectionVariables.set('tokenPaciente', res.token);",
                  "}"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "X-API-Key", value: "{{apiKey}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                nombre: "Estudiante Investigador {{timestamp}}",
                email: "estudiante.autor.{{timestamp}}@veritas.ai",
                password: "Password123*"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/api/auth/registro", host: ["{{baseUrl}}"], path: ["api", "auth", "registro"] }
          }
        },
        {
          name: "4. Login Estudiante Registrado (200 OK)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 200 OK', function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "var res = pm.response.json();",
                  "if (res.token) {",
                  "    pm.environment.set('tokenEstudiante', res.token);",
                  "    pm.collectionVariables.set('tokenEstudiante', res.token);",
                  "    pm.environment.set('tokenPaciente', res.token);",
                  "    pm.collectionVariables.set('tokenPaciente', res.token);",
                  "}"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "X-API-Key", value: "{{apiKey}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "estudiante.autor.{{timestamp}}@veritas.ai",
                password: "Password123*"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/api/auth/login", host: ["{{baseUrl}}"], path: ["api", "auth", "login"] }
          }
        },
        {
          name: "5. Consultar Perfil con Bearer Token (200 OK)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 200 OK', function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "GET",
            header: [
              { key: "X-API-Key", value: "{{apiKey}}" },
              { key: "Authorization", value: "Bearer {{tokenAdmin}}" }
            ],
            url: { raw: "{{baseUrl}}/api/auth/perfil", host: ["{{baseUrl}}"], path: ["api", "auth", "perfil"] }
          }
        }
      ]
    },
    {
      name: "Bloque B: Departamentos Académicos",
      item: [
        {
          name: "6. Listar Departamentos Académicos (200 OK)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 200 OK', function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "GET",
            header: [
              { key: "X-API-Key", value: "{{apiKey}}" },
              { key: "Authorization", value: "Bearer {{tokenAdmin}}" }
            ],
            url: { raw: "{{baseUrl}}/api/departamentos", host: ["{{baseUrl}}"], path: ["api", "departamentos"] }
          }
        },
        {
          name: "7. Crear Departamento Académico (201 Created)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 201 Created', function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "var res = pm.response.json();",
                  "var dep = res.departamento || res.especialidad;",
                  "if (dep && dep.id) {",
                  "    pm.environment.set('departamentoId', dep.id);",
                  "    pm.collectionVariables.set('departamentoId', dep.id);",
                  "    pm.environment.set('especialidadId', dep.id);",
                  "    pm.collectionVariables.set('especialidadId', dep.id);",
                  "}"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "X-API-Key", value: "{{apiKey}}" },
              { key: "Authorization", value: "Bearer {{tokenAdmin}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                nombre: "Inteligencia Artificial y Ética Computacional {{timestamp}}",
                descripcion: "Investigación en integridad académica, modelos LLM y PLN",
                activa: true
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/api/departamentos", host: ["{{baseUrl}}"], path: ["api", "departamentos"] }
          }
        },
        {
          name: "8. Departamento Académico Duplicado (409 Conflict)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 409 Conflict', function () {",
                  "    pm.response.to.have.status(409);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "X-API-Key", value: "{{apiKey}}" },
              { key: "Authorization", value: "Bearer {{tokenAdmin}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                nombre: "inteligencia artificial y ética computacional {{timestamp}}",
                descripcion: "Duplicado en minúsculas",
                activa: true
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/api/departamentos", host: ["{{baseUrl}}"], path: ["api", "departamentos"] }
          }
        },
        {
          name: "9. Crear Departamento con Token de Estudiante (403 Forbidden - RBAC)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 403 Forbidden', function () {",
                  "    pm.response.to.have.status(403);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "X-API-Key", value: "{{apiKey}}" },
              { key: "Authorization", value: "Bearer {{tokenEstudiante}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                nombre: "Departamento No Autorizado {{timestamp}}",
                descripcion: "Intento sin privilegios",
                activa: true
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/api/departamentos", host: ["{{baseUrl}}"], path: ["api", "departamentos"] }
          }
        }
      ]
    },
    {
      name: "Bloque C: Docentes y Auditores de Ética",
      item: [
        {
          name: "10. Crear Docente Auditor (201 Created)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 201 Created', function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "var res = pm.response.json();",
                  "var doc = res.docente || res.medico;",
                  "if (doc && doc.id) {",
                  "    pm.environment.set('docenteId', doc.id);",
                  "    pm.collectionVariables.set('docenteId', doc.id);",
                  "    pm.environment.set('medicoId', doc.id);",
                  "    pm.collectionVariables.set('medicoId', doc.id);",
                  "}"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "X-API-Key", value: "{{apiKey}}" },
              { key: "Authorization", value: "Bearer {{tokenAdmin}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                nombre: "Dr. Carlos Ruiz {{timestamp}}",
                registroAcademico: "DOC-{{timestamp}}",
                registroMedico: "DOC-{{timestamp}}",
                email: "carlos.ruiz.{{timestamp}}@veritas.ai",
                telefono: "3101112233",
                departamentoId: 1,
                especialidadId: 1,
                activo: true
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/api/docentes", host: ["{{baseUrl}}"], path: ["api", "docentes"] }
          }
        },
        {
          name: "11. Código de Docente Duplicado (409 Conflict)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 409 Conflict', function () {",
                  "    pm.response.to.have.status(409);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "X-API-Key", value: "{{apiKey}}" },
              { key: "Authorization", value: "Bearer {{tokenAdmin}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                nombre: "Dr. Carlos Ruiz Duplicado",
                registroAcademico: "DOC-{{timestamp}}",
                registroMedico: "DOC-{{timestamp}}",
                email: "carlos.otro.{{timestamp}}@veritas.ai",
                telefono: "3101112233",
                departamentoId: 1,
                especialidadId: 1,
                activo: true
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/api/docentes", host: ["{{baseUrl}}"], path: ["api", "docentes"] }
          }
        }
      ]
    },
    {
      name: "Bloque D: Estudiantes Autores y Laboratorios de Cómputo",
      item: [
        {
          name: "12. Crear Estudiante Autor (201 Created)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 201 Created', function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "var res = pm.response.json();",
                  "var est = res.estudiante || res.paciente;",
                  "if (est && est.id) {",
                  "    pm.environment.set('estudianteId', est.id);",
                  "    pm.collectionVariables.set('estudianteId', est.id);",
                  "    pm.environment.set('pacienteId', est.id);",
                  "    pm.collectionVariables.set('pacienteId', est.id);",
                  "}"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "X-API-Key", value: "{{apiKey}}" },
              { key: "Authorization", value: "Bearer {{tokenAdmin}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                nombre: "Laura Méndez {{timestamp}}",
                documento: "DOC-{{timestamp}}",
                email: "laura.{{timestamp}}@veritas.ai",
                telefono: "3123456789",
                fechaNacimiento: "1998-05-12"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/api/estudiantes", host: ["{{baseUrl}}"], path: ["api", "estudiantes"] }
          }
        },
        {
          name: "13. Documento de Estudiante Duplicado (409 Conflict)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 409 Conflict', function () {",
                  "    pm.response.to.have.status(409);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "X-API-Key", value: "{{apiKey}}" },
              { key: "Authorization", value: "Bearer {{tokenAdmin}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                nombre: "Laura Méndez Copia",
                documento: "DOC-{{timestamp}}",
                email: "laura.copia.{{timestamp}}@veritas.ai",
                telefono: "3123456789",
                fechaNacimiento: "1998-05-12"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/api/estudiantes", host: ["{{baseUrl}}"], path: ["api", "estudiantes"] }
          }
        },
        {
          name: "14. Crear Laboratorio de Cómputo (201 Created)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 201 Created', function () {",
                  "    pm.response.to.have.status(201);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "X-API-Key", value: "{{apiKey}}" },
              { key: "Authorization", value: "Bearer {{tokenAdmin}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                codigo: "LAB-{{timestamp}}",
                nombre: "Laboratorio de PLN y Cómputo Ético {{timestamp}}",
                piso: 3,
                ubicacion: "Edificio de Ingeniería - Cómputo Avanzado",
                activo: true
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/api/laboratorios", host: ["{{baseUrl}}"], path: ["api", "laboratorios"] }
          }
        }
      ]
    },
    {
      name: "Bloque E: Revisiones Éticas y Agenda de Auditoría",
      item: [
        {
          name: "15. Crear Revisión Ética Válida (201 Created)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 201 Created', function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "var res = pm.response.json();",
                  "var r = res.revision || res.cita;",
                  "if (r && r.id) {",
                  "    pm.environment.set('revisionId', r.id);",
                  "    pm.collectionVariables.set('revisionId', r.id);",
                  "    pm.environment.set('citaId', r.id);",
                  "    pm.collectionVariables.set('citaId', r.id);",
                  "}"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "X-API-Key", value: "{{apiKey}}" },
              { key: "Authorization", value: "Bearer {{tokenAdmin}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                estudianteId: 1,
                docenteId: 1,
                laboratorioId: 1,
                pacienteId: 1,
                medicoId: 1,
                consultorioId: 1,
                fecha: "{{fechaRevision}}",
                hora: "{{horaRevision}}",
                motivo: "Auditoría de originalidad, perplejidad y similitud semántica en tesis de IA"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/api/revisiones", host: ["{{baseUrl}}"], path: ["api", "revisiones"] }
          }
        },
        {
          name: "16. Conflicto de Horario / Doble Asignación (409 Conflict)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 409 Conflict', function () {",
                  "    pm.response.to.have.status(409);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "X-API-Key", value: "{{apiKey}}" },
              { key: "Authorization", value: "Bearer {{tokenAdmin}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                estudianteId: 2,
                docenteId: 1,
                laboratorioId: 1,
                pacienteId: 2,
                medicoId: 1,
                consultorioId: 1,
                fecha: "{{fechaRevision}}",
                hora: "{{horaRevision}}",
                motivo: "Auditoría solapada en mismo laboratorio y docente"
              }, null, 2)
            },
            url: { raw: "{{baseUrl}}/api/revisiones", host: ["{{baseUrl}}"], path: ["api", "revisiones"] }
          }
        },
        {
          name: "17. Cambio de Estado Válido: confirmada (200 OK)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 200 OK', function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "PATCH",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "X-API-Key", value: "{{apiKey}}" },
              { key: "Authorization", value: "Bearer {{tokenAdmin}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({ estado: "confirmada" }, null, 2)
            },
            url: { raw: "{{baseUrl}}/api/revisiones/{{revisionId}}/estado", host: ["{{baseUrl}}"], path: ["api", "revisiones", "{{revisionId}}", "estado"] }
          }
        },
        {
          name: "18. Cambio de Estado Válido: atendida (200 OK)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 200 OK', function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "PATCH",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "X-API-Key", value: "{{apiKey}}" },
              { key: "Authorization", value: "Bearer {{tokenAdmin}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({ estado: "atendida" }, null, 2)
            },
            url: { raw: "{{baseUrl}}/api/revisiones/{{revisionId}}/estado", host: ["{{baseUrl}}"], path: ["api", "revisiones", "{{revisionId}}", "estado"] }
          }
        },
        {
          name: "19. Cambio de Estado Inválido de atendida a programada (409 Conflict)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 409 Conflict', function () {",
                  "    pm.response.to.have.status(409);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "PATCH",
            header: [
              { key: "Content-Type", value: "application/json" },
              { key: "X-API-Key", value: "{{apiKey}}" },
              { key: "Authorization", value: "Bearer {{tokenAdmin}}" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({ estado: "programada" }, null, 2)
            },
            url: { raw: "{{baseUrl}}/api/revisiones/{{revisionId}}/estado", host: ["{{baseUrl}}"], path: ["api", "revisiones", "{{revisionId}}", "estado"] }
          }
        }
      ]
    },
    {
      name: "Bloque F: Seguridad BOLA / IDOR e Integridad Referencial",
      item: [
        {
          name: "20. Consultar Revisiones Propias con Token de Estudiante (200 OK)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 200 OK', function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "GET",
            header: [
              { key: "X-API-Key", value: "{{apiKey}}" },
              { key: "Authorization", value: "Bearer {{tokenEstudiante}}" }
            ],
            url: { raw: "{{baseUrl}}/api/revisiones/mis-revisiones", host: ["{{baseUrl}}"], path: ["api", "revisiones", "mis-revisiones"] }
          }
        },
        {
          name: "21. Consultar Revisión Ajena con Token de Estudiante (403 Forbidden - BOLA Bloqueado)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 403 Forbidden', function () {",
                  "    pm.response.to.have.status(403);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "GET",
            header: [
              { key: "X-API-Key", value: "{{apiKey}}" },
              { key: "Authorization", value: "Bearer {{tokenEstudiante}}" }
            ],
            url: { raw: "{{baseUrl}}/api/revisiones/1", host: ["{{baseUrl}}"], path: ["api", "revisiones", "1"] }
          }
        },
        {
          name: "22. Eliminar Estudiante con Revisiones Activas (409 Conflict - Integridad Referencial)",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "pm.test('Status code is 409 Conflict', function () {",
                  "    pm.response.to.have.status(409);",
                  "});"
                ],
                type: "text/javascript"
              }
            }
          ],
          request: {
            method: "DELETE",
            header: [
              { key: "X-API-Key", value: "{{apiKey}}" },
              { key: "Authorization", value: "Bearer {{tokenAdmin}}" }
            ],
            url: { raw: "{{baseUrl}}/api/estudiantes/1", host: ["{{baseUrl}}"], path: ["api", "estudiantes", "1"] }
          }
        }
      ]
    }
  ]
};

const rootHospital = path.resolve(__dirname, '../Postman_Lab11_Hospital.json');
const rootVeritas = path.resolve(__dirname, '../Postman_Lab11_VeritasAI.json');

fs.writeFileSync(rootHospital, JSON.stringify(collection, null, 2), 'utf-8');
fs.writeFileSync(rootVeritas, JSON.stringify(collection, null, 2), 'utf-8');

console.log('✅ Archivos Postman_Lab11_Hospital.json y Postman_Lab11_VeritasAI.json generados exitosamente con 22 pruebas 100% Veritas AI.');
