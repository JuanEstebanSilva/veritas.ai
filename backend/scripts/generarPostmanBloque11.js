const fs = require('fs');
const path = require('path');

const collection = {
  info: {
    _postman_id: 'b8e9f1a2-c3d4-4e5f-6a7b-8c9d0e1f2a3b',
    name: 'Lab 11 — Veritas AI: Actualización Progresiva de API Segura (Paso 8 y Bloque 11)',
    description: 'Colección oficial de pruebas automatizadas del Bloque 11 para Veritas AI (Plataforma de Integridad Académica). Incluye los 25 casos de prueba de actualización progresiva de seguridad, version_sesion, recuperación administrativa, códigos de respaldo de un solo uso, desacoplamiento de API Key, RBAC, BOLA/IDOR y CORS.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:5000', type: 'string' },
    { key: 'apiKey', value: '61135a3dc83768741e1c3eb1b8210dc60e78f265fbbe86ddb931a299ab42a3d0', type: 'string' },
    { key: 'adminEmail', value: 'admin@veritas.ai', type: 'string' },
    { key: 'adminPassword', value: 'SANTOTO_2026--2', type: 'string' },
    { key: 'tokenAdmin', value: '', type: 'string' },
    { key: 'tokenEstudiante', value: '', type: 'string' },
    { key: 'tokenEstudianteAnterior', value: '', type: 'string' },
    { key: 'estudianteId', value: '2', type: 'string' },
    { key: 'estudianteEmail', value: 'estudiante.a@veritas.com', type: 'string' },
    { key: 'claveEstudiante', value: 'Password123*', type: 'string' },
    { key: 'claveNueva', value: 'NuevaClaveSegura2026!', type: 'string' },
    { key: 'tokenRecuperacion', value: '', type: 'string' },
    { key: 'codigoRespaldo', value: '', type: 'string' },
    { key: 'codigoRespaldo2', value: '', type: 'string' }
  ],
  item: [
    {
      name: '00. Configuración Inicial (Registro de Estudiante de Prueba)',
      request: {
        method: 'POST',
        header: [
          { key: 'X-API-Key', value: '{{apiKey}}', type: 'text' },
          { key: 'Content-Type', value: 'application/json', type: 'text' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            nombre: 'Estudiante Auditoria Bloque 11',
            email: 'estudiante.bloque11.postman@veritas.ai',
            password: 'Password123*'
          }, null, 2)
        },
        url: { raw: '{{baseUrl}}/api/auth/registro', host: ['{{baseUrl}}'], path: ['api', 'auth', 'registro'] }
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'if (pm.response.code === 201 || pm.response.code === 200) {',
              '    var json = pm.response.json();',
              '    pm.collectionVariables.set("estudianteEmail", "estudiante.bloque11.postman@veritas.ai");',
              '    pm.collectionVariables.set("claveEstudiante", "Password123*");',
              '    if (json.usuario && json.usuario.id) {',
              '        pm.collectionVariables.set("estudianteId", String(json.usuario.id));',
              '    }',
              '}'
            ],
            type: 'text/javascript'
          }
        }
      ]
    },
    {
      name: 'Fase 1: Login, JWT y version_sesion (Pruebas 1 a 7)',
      item: [
        {
          name: '01. Login válido POST /api/auth/login',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json', type: 'text' }],
            body: { mode: 'raw', raw: JSON.stringify({ email: '{{estudianteEmail}}', password: '{{claveEstudiante}}' }) },
            url: { raw: '{{baseUrl}}/api/auth/login', host: ['{{baseUrl}}'], path: ['api', 'auth', 'login'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });',
                'var json = pm.response.json();',
                'pm.expect(json.token).to.be.a("string");',
                'pm.collectionVariables.set("tokenEstudiante", json.token);',
                'pm.collectionVariables.set("tokenEstudianteAnterior", json.token);'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '01B. Login Administrador (Captura tokenAdmin)',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json', type: 'text' }],
            body: { mode: 'raw', raw: JSON.stringify({ email: '{{adminEmail}}', password: '{{adminPassword}}' }) },
            url: { raw: '{{baseUrl}}/api/auth/login', host: ['{{baseUrl}}'], path: ['api', 'auth', 'login'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Admin login 200 OK", function () { pm.response.to.have.status(200); });',
                'var json = pm.response.json();',
                'pm.collectionVariables.set("tokenAdmin", json.token);'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '02. Login con JSON o cuerpo inválido',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json', type: 'text' }],
            body: { mode: 'raw', raw: JSON.stringify({ email: 'correo-no-valido', password: '' }) },
            url: { raw: '{{baseUrl}}/api/auth/login', host: ['{{baseUrl}}'], path: ['api', 'auth', 'login'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 400 Bad Request", function () { pm.response.to.have.status(400); });'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '03. Perfil o recurso protegido GET /api/auth/perfil sin JWT',
          request: {
            method: 'GET',
            url: { raw: '{{baseUrl}}/api/auth/perfil', host: ['{{baseUrl}}'], path: ['api', 'auth', 'perfil'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 401 Unauthorized", function () { pm.response.to.have.status(401); });'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '04. Cambio de contraseña con contraseña actual correcta',
          request: {
            method: 'PATCH',
            header: [
              { key: 'Authorization', value: 'Bearer {{tokenEstudiante}}', type: 'text' },
              { key: 'Content-Type', value: 'application/json', type: 'text' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                passwordActual: '{{claveEstudiante}}',
                passwordNueva: '{{claveNueva}}',
                confirmarPassword: '{{claveNueva}}'
              })
            },
            url: { raw: '{{baseUrl}}/api/auth/cambiar-password', host: ['{{baseUrl}}'], path: ['api', 'auth', 'cambiar-password'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '05. Intento de usar JWT anterior (Sesión revocada)',
          request: {
            method: 'GET',
            header: [
              { key: 'Authorization', value: 'Bearer {{tokenEstudianteAnterior}}', type: 'text' }
            ],
            url: { raw: '{{baseUrl}}/api/auth/perfil', host: ['{{baseUrl}}'], path: ['api', 'auth', 'perfil'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 401 Sesión revocada", function () {',
                '    pm.response.to.have.status(401);',
                '    var json = pm.response.json();',
                '    pm.expect(json.mensaje || json.message).to.match(/Sesión revocada/i);',
                '});'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '06. Login con contraseña nueva',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json', type: 'text' }],
            body: { mode: 'raw', raw: JSON.stringify({ email: '{{estudianteEmail}}', password: '{{claveNueva}}' }) },
            url: { raw: '{{baseUrl}}/api/auth/login', host: ['{{baseUrl}}'], path: ['api', 'auth', 'login'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });',
                'var json = pm.response.json();',
                'pm.collectionVariables.set("tokenEstudiante", json.token);'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '07. Cambio de contraseña con contraseña actual incorrecta',
          request: {
            method: 'PATCH',
            header: [
              { key: 'Authorization', value: 'Bearer {{tokenEstudiante}}', type: 'text' },
              { key: 'Content-Type', value: 'application/json', type: 'text' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                passwordActual: 'ClaveCompletamenteErronea999*',
                passwordNueva: 'OtraClaveCualquiera2026!',
                confirmarPassword: 'OtraClaveCualquiera2026!'
              })
            },
            url: { raw: '{{baseUrl}}/api/auth/cambiar-password', host: ['{{baseUrl}}'], path: ['api', 'auth', 'cambiar-password'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 401 Contraseña actual inválida", function () {',
                '    pm.response.to.have.status(401);',
                '});'
              ],
              type: 'text/javascript'
            }
          }]
        }
      ]
    },
    {
      name: 'Fase 2: Recuperación Administrativa y Token (Pruebas 8 a 11)',
      item: [
        {
          name: '08. Administrador genera recuperación para una cuenta de prueba',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{tokenAdmin}}', type: 'text' }
            ],
            url: { raw: '{{baseUrl}}/api/auth/recuperacion/admin/{{estudianteId}}', host: ['{{baseUrl}}'], path: ['api', 'auth', 'recuperacion', 'admin', '{{estudianteId}}'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 201 Created", function () { pm.response.to.have.status(201); });',
                'var json = pm.response.json();',
                'pm.expect(json.token).to.be.a("string");',
                'pm.collectionVariables.set("tokenRecuperacion", json.token);'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '09. Restablecimiento mediante token válido',
          request: {
            method: 'POST',
            header: [
              { key: 'X-API-Key', value: '{{apiKey}}', type: 'text' },
              { key: 'Content-Type', value: 'application/json', type: 'text' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                token: '{{tokenRecuperacion}}',
                passwordNueva: 'ClaveRestablecidaToken2026!',
                confirmarPassword: 'ClaveRestablecidaToken2026!'
              })
            },
            url: { raw: '{{baseUrl}}/api/auth/restablecer-password', host: ['{{baseUrl}}'], path: ['api', 'auth', 'restablecer-password'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });',
                'pm.collectionVariables.set("claveEstudiante", "ClaveRestablecidaToken2026!");'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '10. Reutilización o vencimiento del token',
          request: {
            method: 'POST',
            header: [
              { key: 'X-API-Key', value: '{{apiKey}}', type: 'text' },
              { key: 'Content-Type', value: 'application/json', type: 'text' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                token: '{{tokenRecuperacion}}',
                passwordNueva: 'IntentoReutilizacion2026!',
                confirmarPassword: 'IntentoReutilizacion2026!'
              })
            },
            url: { raw: '{{baseUrl}}/api/auth/restablecer-password', host: ['{{baseUrl}}'], path: ['api', 'auth', 'restablecer-password'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 400 Bad Request", function () { pm.response.to.have.status(400); });'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '11. Login estudiante con clave restablecida',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json', type: 'text' }],
            body: { mode: 'raw', raw: JSON.stringify({ email: '{{estudianteEmail}}', password: '{{claveEstudiante}}' }) },
            url: { raw: '{{baseUrl}}/api/auth/login', host: ['{{baseUrl}}'], path: ['api', 'auth', 'login'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Login 200 OK", function () { pm.response.to.have.status(200); });',
                'var json = pm.response.json();',
                'pm.collectionVariables.set("tokenEstudiante", json.token);'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '11B. Estudiante intenta generar recuperación administrativa (403 RBAC)',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{tokenEstudiante}}', type: 'text' }
            ],
            url: { raw: '{{baseUrl}}/api/auth/recuperacion/admin/{{estudianteId}}', host: ['{{baseUrl}}'], path: ['api', 'auth', 'recuperacion', 'admin', '{{estudianteId}}'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 403 Forbidden por RBAC", function () { pm.response.to.have.status(403); });'
              ],
              type: 'text/javascript'
            }
          }]
        }
      ]
    },
    {
      name: 'Fase 3: Códigos de Respaldo de Un Solo Uso (Pruebas 12 a 16)',
      item: [
        {
          name: '12. Usuario autenticado genera ocho códigos de respaldo',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{tokenEstudiante}}', type: 'text' },
              { key: 'Content-Type', value: 'application/json', type: 'text' }
            ],
            body: { mode: 'raw', raw: JSON.stringify({ passwordActual: '{{claveEstudiante}}' }) },
            url: { raw: '{{baseUrl}}/api/auth/codigos-recuperacion', host: ['{{baseUrl}}'], path: ['api', 'auth', 'codigos-recuperacion'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 201 Created y 8 códigos", function () {',
                '    pm.response.to.have.status(201);',
                '    var json = pm.response.json();',
                '    pm.expect(json.codigos).to.be.an("array").with.lengthOf(8);',
                '    pm.collectionVariables.set("codigoRespaldo", json.codigos[0]);',
                '    pm.collectionVariables.set("codigoRespaldo2", json.codigos[1]);',
                '});'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '13. Consulta de estado de códigos de respaldo',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{tokenEstudiante}}', type: 'text' }],
            url: { raw: '{{baseUrl}}/api/auth/codigos-recuperacion/estado', host: ['{{baseUrl}}'], path: ['api', 'auth', 'codigos-recuperacion', 'estado'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 200 OK y saldo 8", function () {',
                '    pm.response.to.have.status(200);',
                '    var json = pm.response.json();',
                '    pm.expect(json.disponibles).to.eql(8);',
                '});'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '14. Regeneración de códigos de respaldo',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{tokenEstudiante}}', type: 'text' },
              { key: 'Content-Type', value: 'application/json', type: 'text' }
            ],
            body: { mode: 'raw', raw: JSON.stringify({ passwordActual: '{{claveEstudiante}}' }) },
            url: { raw: '{{baseUrl}}/api/auth/codigos-recuperacion/regenerar', host: ['{{baseUrl}}'], path: ['api', 'auth', 'codigos-recuperacion', 'regenerar'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 201 Created", function () {',
                '    pm.response.to.have.status(201);',
                '    var json = pm.response.json();',
                '    pm.collectionVariables.set("codigoRespaldo", json.codigos[0]);',
                '    pm.collectionVariables.set("codigoRespaldo2", json.codigos[1]);',
                '});'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '15. Restablecimiento con un código válido',
          request: {
            method: 'POST',
            header: [
              { key: 'X-API-Key', value: '{{apiKey}}', type: 'text' },
              { key: 'Content-Type', value: 'application/json', type: 'text' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                email: '{{estudianteEmail}}',
                codigo: '{{codigoRespaldo2}}',
                passwordNueva: 'ClaveRestablecidaCodigo2026!',
                confirmarPassword: 'ClaveRestablecidaCodigo2026!'
              })
            },
            url: { raw: '{{baseUrl}}/api/auth/restablecer-con-codigo', host: ['{{baseUrl}}'], path: ['api', 'auth', 'restablecer-con-codigo'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });',
                'pm.collectionVariables.set("claveEstudiante", "ClaveRestablecidaCodigo2026!");'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '16. Reutilización de un código ya consumido',
          request: {
            method: 'POST',
            header: [
              { key: 'X-API-Key', value: '{{apiKey}}', type: 'text' },
              { key: 'Content-Type', value: 'application/json', type: 'text' }
            ],
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                email: '{{estudianteEmail}}',
                codigo: '{{codigoRespaldo2}}',
                passwordNueva: 'OtraClaveCualquiera2026!',
                confirmarPassword: 'OtraClaveCualquiera2026!'
              })
            },
            url: { raw: '{{baseUrl}}/api/auth/restablecer-con-codigo', host: ['{{baseUrl}}'], path: ['api', 'auth', 'restablecer-con-codigo'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 400 Bad Request", function () { pm.response.to.have.status(400); });'
              ],
              type: 'text/javascript'
            }
          }]
        }
      ]
    },
    {
      name: 'Fase 4: Revisiones Éticas y Defensa BOLA / IDOR (Pruebas 17 a 19)',
      item: [
        {
          name: '17. Login estudiante con clave restablecida tras código',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json', type: 'text' }],
            body: { mode: 'raw', raw: JSON.stringify({ email: '{{estudianteEmail}}', password: '{{claveEstudiante}}' }) },
            url: { raw: '{{baseUrl}}/api/auth/login', host: ['{{baseUrl}}'], path: ['api', 'auth', 'login'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Login 200 OK", function () { pm.response.to.have.status(200); });',
                'var json = pm.response.json();',
                'pm.collectionVariables.set("tokenEstudiante", json.token);'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '17B. Estudiante consulta /api/revisiones/mis-revisiones con JWT',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{tokenEstudiante}}', type: 'text' }],
            url: { raw: '{{baseUrl}}/api/revisiones/mis-revisiones', host: ['{{baseUrl}}'], path: ['api', 'revisiones', 'mis-revisiones'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '18. Estudiante consulta revisión de otro autor/estudiante (BOLA / IDOR)',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{tokenEstudiante}}', type: 'text' }],
            url: { raw: '{{baseUrl}}/api/revisiones/1', host: ['{{baseUrl}}'], path: ['api', 'revisiones', '1'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 403 Forbidden por BOLA", function () { pm.response.to.have.status(403); });'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '19. Estudiante intenta GET /api/revisiones global administrativo',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{tokenEstudiante}}', type: 'text' }],
            url: { raw: '{{baseUrl}}/api/revisiones', host: ['{{baseUrl}}'], path: ['api', 'revisiones'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 403 Forbidden por RBAC", function () { pm.response.to.have.status(403); });'
              ],
              type: 'text/javascript'
            }
          }]
        }
      ]
    },
    {
      name: 'Fase 5: Desacoplamiento de API Key, Recursos JWT y Swagger (Pruebas 20 a 25)',
      item: [
        {
          name: '20. GET /api/seguridad/cliente sin API Key',
          request: {
            method: 'GET',
            url: { raw: '{{baseUrl}}/api/seguridad/cliente', host: ['{{baseUrl}}'], path: ['api', 'seguridad', 'cliente'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 401 Unauthorized", function () { pm.response.to.have.status(401); });'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '21. GET /api/seguridad/cliente con API Key válida',
          request: {
            method: 'GET',
            header: [{ key: 'X-API-Key', value: '{{apiKey}}', type: 'text' }],
            url: { raw: '{{baseUrl}}/api/seguridad/cliente', host: ['{{baseUrl}}'], path: ['api', 'seguridad', 'cliente'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '22. Login sin API Key y con cuerpo inválido',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json', type: 'text' }],
            body: { mode: 'raw', raw: JSON.stringify({ email: 'invalido', password: '' }) },
            url: { raw: '{{baseUrl}}/api/auth/login', host: ['{{baseUrl}}'], path: ['api', 'auth', 'login'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 400 Bad Request", function () { pm.response.to.have.status(400); });'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '23. mis-revisiones sin JWT y sin API Key',
          request: {
            method: 'GET',
            url: { raw: '{{baseUrl}}/api/revisiones/mis-revisiones', host: ['{{baseUrl}}'], path: ['api', 'revisiones', 'mis-revisiones'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 401 Unauthorized", function () { pm.response.to.have.status(401); });'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '24. mis-revisiones con JWT y sin API Key (Recurso desacoplado)',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{tokenEstudiante}}', type: 'text' }],
            url: { raw: '{{baseUrl}}/api/revisiones/mis-revisiones', host: ['{{baseUrl}}'], path: ['api', 'revisiones', 'mis-revisiones'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 200 OK desacoplado", function () { pm.response.to.have.status(200); });'
              ],
              type: 'text/javascript'
            }
          }]
        },
        {
          name: '25. OpenAPI / Swagger expone especificación con seguridad explícita',
          request: {
            method: 'GET',
            url: { raw: '{{baseUrl}}/api/docs/swagger.json', host: ['{{baseUrl}}'], path: ['api', 'docs', 'swagger.json'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 200 OK y OpenAPI 3.0.3", function () {',
                '    pm.response.to.have.status(200);',
                '    var json = pm.response.json();',
                '    pm.expect(json.openapi).to.match(/^3\\./);',
                '});'
              ],
              type: 'text/javascript'
            }
          }]
        }
      ]
    },
    {
      name: 'Fase 6: Preflight CORS para React + Vite (Paso 10)',
      item: [
        {
          name: 'Preflight OPTIONS /api/auth/login desde http://localhost:5173',
          request: {
            method: 'OPTIONS',
            header: [
              { key: 'Origin', value: 'http://localhost:5173', type: 'text' },
              { key: 'Access-Control-Request-Method', value: 'POST', type: 'text' },
              { key: 'Access-Control-Request-Headers', value: 'content-type', type: 'text' }
            ],
            url: { raw: '{{baseUrl}}/api/auth/login', host: ['{{baseUrl}}'], path: ['api', 'auth', 'login'] }
          },
          event: [{
            listen: 'test',
            script: {
              exec: [
                'pm.test("Status code is 204 No Content y CORS permitido", function () {',
                '    pm.response.to.have.status(204);',
                '    pm.expect(pm.response.headers.get("Access-Control-Allow-Origin")).to.eql("http://localhost:5173");',
                '});'
              ],
              type: 'text/javascript'
            }
          }]
        }
      ]
    }
  ]
};

const destino = path.join(__dirname, '..', '..', 'Postman_Lab11_VeritasAI.json');
fs.writeFileSync(destino, JSON.stringify(collection, null, 2), 'utf8');
console.log('Coleccion escrita en:', destino);
