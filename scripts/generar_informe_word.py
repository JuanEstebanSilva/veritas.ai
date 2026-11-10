import os
import sys
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOC_PATH = r"D:\Varios\Varios\GitHub\veritas-ai\Informes\2.2_Informe_Evidencias_Veritas_AI.docx"
EVIDENCIAS_DIR = r"D:\Varios\Varios\GitHub\veritas-ai\Evidencias_2.2_VeritasAI"

os.makedirs(os.path.dirname(DOC_PATH), exist_ok=True)

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_report():
    doc = Document()

    # Configuración de márgenes a 1 pulgada (2.54 cm)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Estilo base
    style_normal = doc.styles['Normal']
    font_normal = style_normal.font
    font_normal.name = 'Times New Roman'
    font_normal.size = Pt(10.5)
    font_normal.color.rgb = RGBColor(0x1a, 0x1a, 0x1a)

    # TÍTULO PRINCIPAL (16 pt, negrita, centrado, sin portada)
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(8)
    run_title = p_title.add_run("2.2. Evidencias de implementación y verificación del Bloque 11 en Veritas AI")
    run_title.font.name = 'Times New Roman'
    run_title.font.size = Pt(16)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

    # Subtítulo institucional / técnico
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(18)
    run_sub = p_sub.add_run("Plataforma de Integridad Académica, Detección de Plagio e Inteligencia Artificial\nAuditoría Técnica, Validación Criptográfica, Control RBAC, BOLA/IDOR y Registro de Evidencias")
    run_sub.font.name = 'Times New Roman'
    run_sub.font.size = Pt(11)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # Helper para subtítulos de sección (14 pt, negrita)
    def add_section_header(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(title)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(14)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)
        return p

    # Helper para párrafos descriptivos de contexto
    def add_context_p(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(10.5)
        run.font.color.rgb = RGBColor(0x1e, 0x29, 0x3b)
        return p

    # Helper para agregar figuras de evidencia (Imagen 4.5" + Caption 9.5 pt + Descripción técnica ~3 líneas 10.5 pt)
    def add_evidence_figure(fig_num, title, image_filename, desc_text):
        img_path = os.path.join(EVIDENCIAS_DIR, image_filename)
        if not os.path.exists(img_path):
            print(f"ALERTA: Imagen no encontrada: {img_path}")
            return

        # 1. Párrafo con la imagen centrada
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        p_img.paragraph_format.keep_with_next = True
        run_img = p_img.add_run()
        run_img.add_picture(img_path, width=Inches(4.5))

        # 2. Epígrafe / Caption (9.5 pt, centrado, prefijo en negrita)
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(4)
        p_cap.paragraph_format.keep_with_next = True
        
        run_prefix = p_cap.add_run(f"Figura {fig_num}. ")
        run_prefix.font.name = 'Times New Roman'
        run_prefix.font.size = Pt(9.5)
        run_prefix.font.bold = True
        run_prefix.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

        run_title = p_cap.add_run(title)
        run_title.font.name = 'Times New Roman'
        run_title.font.size = Pt(9.5)
        run_title.font.bold = False
        run_title.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

        # 3. Descripción técnica de 3 líneas (10.5 pt, justificado)
        p_desc = doc.add_paragraph()
        p_desc.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_desc.paragraph_format.space_before = Pt(2)
        p_desc.paragraph_format.space_after = Pt(14)
        p_desc.paragraph_format.line_spacing = 1.15

        run_desc = p_desc.add_run(desc_text)
        run_desc.font.name = 'Times New Roman'
        run_desc.font.size = Pt(10.5)
        run_desc.font.color.rgb = RGBColor(0x1e, 0x29, 0x3b)

    # =========================================================================
    # SECCIÓN 1: Verificación de la Arquitectura y Base de Datos Académica
    # =========================================================================
    add_section_header("1. Verificación de la Arquitectura y Base de Datos Académica")
    add_context_p(
        "La base de datos relacional de Veritas AI en PostgreSQL alberga el modelo educativo integral de la plataforma, "
        "compuesto por usuarios institucionales, perfiles de estudiantes y autores, docentes auditores de integridad, departamentos "
        "académicos, laboratorios de cómputo y revisiones éticas de coincidencia. La implementación del Bloque 11 introdujo mecanismos "
        "criptográficos de persistencia para el control de sesiones y recuperación de cuentas. A continuación, se documentan las "
        "comprobaciones estructurales efectuadas directamente sobre el motor de persistencia."
    )

    add_evidence_figure(
        1,
        "Verificación de las tablas del dominio académico y roles vigentes en PostgreSQL",
        "figura_01_tablas_dominio_academico.png",
        "Se ejecutaron consultas en PostgreSQL mediante la utilidad psql para auditar la existencia de las nueve tablas fundamentales de Veritas AI (roles, usuarios, departamentos, estudiantes, docentes, laboratorios, revisiones, password_reset_tokens y codigos_recuperacion). La respuesta confirma la creación íntegra de las entidades del modelo educativo y la presencia activa de los roles institucionales administrador (ID 1), docente (ID 2) y estudiante (ID 3). Esta verificación garantiza que el esquema relacional en PostgreSQL está sincronizado con la arquitectura modular y desacoplada de la plataforma."
    )

    add_evidence_figure(
        2,
        "Verificación de Row Level Security (RLS) y columna version_sesion en public.usuarios",
        "figura_02_rls_version_sesion.png",
        "Se auditó el catálogo del sistema pg_class para constatar que el atributo relrowsecurity se encuentra activado (true) en la totalidad de las tablas del esquema público, y se inspeccionó information_schema.columns sobre la tabla usuarios. La consulta evidencia que el campo version_sesion fue incorporado exitosamente como tipo integer, obligatorio (not null) y con valor por defecto de 1. Esta estructura sienta la base persistente para la invalidación inmediata de tokens JWT ante modificaciones de credenciales."
    )

    add_evidence_figure(
        3,
        "Estructura, integridad referencial e índices de password_reset_tokens y codigos_recuperacion",
        "figura_03_claves_foraneas_indices_recuperacion.png",
        "Se comprobó la definición relacional de las tablas creadas en el Bloque 11, verificando columnas, tipos de datos, restricciones de no nulidad e integridad referencial foránea hacia public.usuarios(id) con regla de eliminación en cascada (ON DELETE CASCADE). Adicionalmente, se comprobaron los índices únicos sobre token_hash y codigo_hash, garantizando que únicamente se almacenen valores sintetizados mediante SHA-256. Esta arquitectura impide que credenciales de recuperación en texto plano queden expuestas ante eventuales volcados de la base de datos."
    )

    add_evidence_figure(
        4,
        "Auditoría de la sesión de conexión del backend y privilegio de omisión rolbypassrls",
        "figura_04_auditoria_sesion_backend_rls_bypass.png",
        "Se ejecutó una consulta de seguridad sobre la vista pg_roles identificando que el backend de Node.js se conecta bajo el rol administrativo postgres, el cual posee la propiedad rolbypassrls = true habilitada por defecto. Este hallazgo técnico demuestra que las políticas RLS a nivel de motor de base de datos son omitidas por la conexión del backend, convirtiendo a los middlewares de Express en la línea primaria y obligatoria de defensa. La autorización, la defensa contra BOLA/IDOR y el control de sesiones deben ser fiscalizados estrictamente en la capa de aplicación."
    )

    # =========================================================================
    # SECCIÓN 2: Control de Sesión, Autenticación y Revocación de Tokens
    # =========================================================================
    add_section_header("2. Control de Sesión, Autenticación y Revocación de Tokens")
    add_context_p(
        "El protocolo de autenticación del Bloque 11 vincula cada token JWT emitido al ciclo de vida del usuario incorporando "
        "el claim de versión de sesión ('vs'). Cuando el usuario actualiza o restablece su contraseña, el backend incrementa atómicamente "
        "el campo version_sesion en PostgreSQL. Los middlewares verifican en cada petición que el claim del token coincida con la "
        "versión persistida; cualquier divergencia genera el rechazo inmediato con código HTTP 401 (Sesión revocada), resolviendo el "
        "problema histórico de tokens residuales vigentes."
    )

    add_evidence_figure(
        5,
        "Autenticación exitosa de estudiante con emisión de JWT conteniendo version_sesion",
        "figura_05_login_estudiante_jwt_version_sesion.png",
        "Se envió una solicitud POST /api/auth/login con credenciales legítimas correspondientes a una cuenta de estudiante registrada en Veritas AI. El controlador respondió con código 200 OK, retornando el objeto del perfil y un token JWT con firma criptográfica HMAC-SHA256 cuyo payload decodificado expone el claim 'vs': 1 junto con el rol estudiante. Esto demuestra la correcta integración entre el ciclo de vida del usuario y la emisión de credenciales de sesión trazables."
    )

    add_evidence_figure(
        6,
        "Rechazo de autenticación ante credenciales erróneas (HTTP 401)",
        "figura_06_login_invalido_credenciales_erroneas.png",
        "Se transmitió una petición POST /api/auth/login suministrando una contraseña no coincidente con el registro de la cuenta del estudiante. El servidor rechazó la operación retornando código 401 Unauthorized con un mensaje genérico controlado de fallo de autenticación, protegiendo a la plataforma contra técnicas de enumeración de cuentas. Esta validación ratifica que no se emiten credenciales de acceso ni se filtran detalles internos ante intentos no autorizados."
    )

    add_evidence_figure(
        7,
        "Bloqueo de acceso a endpoint privado sin cabecera de autenticación (HTTP 401)",
        "figura_07_acceso_perfil_sin_jwt.png",
        "Se intentó consumir el recurso protegido GET /api/auth/perfil sin proporcionar la cabecera Authorization ni token Bearer alguno. El middleware de autenticación auth.middleware.ts interceptó la solicitud denegando el procesamiento con código 401 Unauthorized y el mensaje 'Token de autenticación requerido'. La prueba evidencia que los recursos confidenciales de los usuarios se encuentran estrictamente resguardados en la capa perimetral."
    )

    add_evidence_figure(
        8,
        "Cambio exitoso de contraseña e incremento de version_sesion en base de datos",
        "figura_08_cambio_password_incremento_version_sesion.png",
        "El estudiante autenticado invocó el endpoint POST /api/auth/cambiar-password facilitando su clave actual y estableciendo una nueva contraseña que cumple los requerimientos de complejidad. La API procesó el cambio retornando código 200 OK e incrementó concurrentemente el campo version_sesion en la base de datos de 1 a 2. Esta actualización atómica garantiza la desincronización inmediata de cualquier token que haya sido generado con la versión de sesión previa."
    )

    add_evidence_figure(
        9,
        "Revocación inmediata de sesión al presentar token JWT previo (HTTP 401)",
        "figura_09_revocacion_inmediata_jwt_anterior.png",
        "Inmediatamente después del cambio de clave, se intentó acceder nuevamente a GET /api/auth/perfil reutilizando el token JWT emitido antes del cambio, el cual contenía el claim 'vs': 1. El middleware de autenticación contrastó el valor del payload con la versión vigente en base de datos (version_sesion = 2) y rechazó el consumo con código 401 Unauthorized y mensaje 'Sesión revocada'. Esto prueba la mitigación absoluta contra ataques de secuestro de sesión y uso de tokens residuales."
    )

    add_evidence_figure(
        10,
        "Nuevo inicio de sesión con clave actualizada y emisión de JWT con version_sesion incrementada",
        "figura_10_login_nueva_password_jwt_actualizado.png",
        "Se ejecutó POST /api/auth/login empleando la nueva contraseña del estudiante, obteniendo respuesta 200 OK y un nuevo JWT cuyo payload contiene 'vs': 2. Al utilizar este nuevo token para consultar GET /api/auth/perfil, el servidor concedió acceso inmediato con código 200 OK, validando la plena vigencia de la nueva credencial. El flujo demuestra un ciclo de vida de autenticación robusto, coherente y libre de desincronizaciones de estado."
    )

    add_evidence_figure(
        11,
        "Rechazo de cambio de contraseña ante contraseña actual incorrecta (HTTP 401)",
        "figura_11_rechazo_cambio_password_clave_actual_erronea.png",
        "Se simuló un intento de cambio de credencial mediante POST /api/auth/cambiar-password presentando una contraseña actual que no coincide con el hash persistido. El servicio de usuarios verificó la discrepancia criptográfica mediante bcrypt.compare y denegó la solicitud con código 401 Unauthorized sin alterar el registro ni modificar version_sesion. Esta salvaguarda previene que un atacante con posesión temporal de una sesión modifique la contraseña sin conocer la previa."
    )

    # =========================================================================
    # SECCIÓN 3: Recuperación Administrativa de Cuentas
    # =========================================================================
    add_section_header("3. Recuperación Administrativa de Cuentas")
    add_context_p(
        "Para situaciones de contingencia donde un estudiante o docente pierde el acceso a su cuenta institucional, el Bloque 11 "
        "establece un mecanismo seguro de restablecimiento administrativo. Únicamente usuarios con rol 'administrador' poseen la facultad "
        "de generar un token temporal aleatorio de 64 caracteres. El token se persiste exclusivamente en forma de resumen SHA-256 en "
        "la tabla password_reset_tokens con expiración estricta de 15 minutos y un solo uso."
    )

    add_evidence_figure(
        12,
        "Emisión administrativa de token temporal de recuperación de cuenta (HTTP 201)",
        "figura_12_emision_token_recuperacion_administrativa.png",
        "El usuario con rol ADMIN ejecutó la ruta POST /api/auth/recuperacion/admin/:usuarioId para asistir en el desbloqueo de una cuenta estudiantil. El backend generó un token criptográfico pseudoaleatorio de 64 caracteres en texto claro, persistió su resumen SHA-256 en la tabla password_reset_tokens con vigencia estricta de 15 minutos y retornó código 201 Created. El procedimiento garantiza una recuperación asistida controlada y totalmente auditable."
    )

    add_evidence_figure(
        13,
        "Restablecimiento exitoso de contraseña mediante token de recuperación administrativo",
        "figura_13_restablecimiento_password_token_administrativo.png",
        "El estudiante consumió el endpoint POST /api/auth/restablecer-password aportando el token temporal recibido y definiendo su nueva contraseña personal. El servicio validó el hash SHA-256 del token, comprobó que la fecha de expiración no se hubiera superado, actualizó la clave, marcó el campo fecha_uso con la marca temporal actual e incrementó version_sesion. La respuesta retornó código 200 OK, culminando exitosamente el procedimiento de restablecimiento."
    )

    add_evidence_figure(
        14,
        "Rechazo inmediato ante reintento de uso de token administrativo ya consumido (HTTP 400)",
        "figura_14_rechazo_reutilizacion_token_administrativo.png",
        "Se intentó efectuar un segundo restablecimiento de contraseña reutilizando el mismo token temporal administrativo que acababa de ser consumido en la prueba anterior. El backend consultó la persistencia en password_reset_tokens, detectó que fecha_uso IS NOT NULL y denegó la operación con código 400 Bad Request y mensaje 'Token inválido o expirado'. La prueba comprueba la inmunidad del mecanismo ante ataques de repetición o reuso de credenciales temporales."
    )

    add_evidence_figure(
        15,
        "Control RBAC: Bloqueo de estudiante intentando emitir recuperación administrativa (HTTP 403)",
        "figura_15_bloqueo_rbac_estudiante_recuperacion_admin.png",
        "Una cuenta con rol estudiante intentó invocar el endpoint administrativo POST /api/auth/recuperacion/admin/:usuarioId para forzar la emisión de un token sobre otra cuenta. El middleware de autorización por roles (roles.middleware.ts) evaluó los permisos del usuario y bloqueó de forma concluyente la solicitud con código 403 Forbidden. Este resultado verifica la rigurosidad del control de acceso basado en roles frente a intentos de escalamiento vertical de privilegios."
    )

    # =========================================================================
    # SECCIÓN 4: Códigos de Recuperación de Respaldo de Un Solo Uso
    # =========================================================================
    add_section_header("4. Códigos de Recuperación de Respaldo de Un Solo Uso")
    add_context_p(
        "Como salvaguarda autónoma para los usuarios, se diseñó el sistema de 8 códigos de respaldo (backup recovery codes). "
        "Cada estudiante puede generar un lote de 8 códigos de un solo uso que se entregan inmediatamente en texto plano para su custodia "
        "segura. En la base de datos se almacenan exclusivamente resúmenes criptográficos SHA-256. El uso de cualquier código consume su "
        "registro y actualiza la versión de sesión, mientras que la regeneración invalida en su totalidad los códigos anteriores."
    )

    add_evidence_figure(
        16,
        "Generación de lote de ocho códigos de recuperación de respaldo de un solo uso",
        "figura_16_generacion_codigos_recuperacion_respaldo.png",
        "El estudiante autenticado consumió el endpoint POST /api/auth/codigos-recuperacion para habilitar su mecanismo de contingencia ante pérdida de acceso. El servicio codigosRecuperacion.service.ts generó un conjunto de 8 códigos alfanuméricos únicos de 8 caracteres, calculó sus resúmenes SHA-256 para persistirlos en la tabla codigos_recuperacion y devolvió los códigos en texto claro al usuario con código 201 Created. Este diseño asegura que los códigos crudos nunca permanezcan almacenados en texto plano en la infraestructura de datos."
    )

    add_evidence_figure(
        17,
        "Consulta de estado y disponibilidad de los códigos de respaldo (HTTP 200)",
        "figura_17_consulta_saldo_codigos_recuperacion.png",
        "El estudiante consultó la ruta GET /api/auth/codigos-recuperacion/estado para auditar el inventario de sus códigos de respaldo disponibles. La respuesta 200 OK reportó un total de 8 códigos generados, 8 códigos disponibles y 0 consumidos, sin revelar los hashes ni los contenidos de los mismos. La interfaz permite a los autores y estudiantes verificar la suficiencia de sus claves de contingencia manteniendo la confidencialidad."
    )

    add_evidence_figure(
        18,
        "Regeneración de lote de códigos de respaldo con invalidación del conjunto previo",
        "figura_18_regeneracion_codigos_recuperacion_respaldo.png",
        "Mediante la invocación de POST /api/auth/codigos-recuperacion/regenerar, el estudiante solicitó la renovación completa de sus códigos de respaldo. El servicio ejecutó una transacción que eliminó los registros anteriores pertenecientes al usuario y emitió un nuevo lote de 8 códigos frescos con código 201 Created. Este procedimiento habilita la mitigación inmediata ante eventuales sospechas de compromiso de los códigos físicos o digitales impresos previamente."
    )

    add_evidence_figure(
        19,
        "Restablecimiento exitoso de contraseña mediante código de respaldo de un solo uso",
        "figura_19_restablecimiento_password_codigo_respaldo.png",
        "Se invocó el endpoint de contingencia POST /api/auth/restablecer-con-codigo suministrando el correo electrónico del estudiante, uno de sus códigos de respaldo activos y una nueva contraseña. El sistema validó el hash del código, actualizó la clave de acceso, registró fecha_uso = NOW() e incrementó la versión de sesión, respondiendo con código 200 OK. Se confirma la plena operatividad del flujo de autorrecuperación para el estamento estudiantil."
    )

    add_evidence_figure(
        20,
        "Rechazo inmediato ante intento de reutilización de código de respaldo consumido (HTTP 400)",
        "figura_20_rechazo_reutilizacion_codigo_respaldo.png",
        "Se intentó ejecutar una segunda solicitud a POST /api/auth/restablecer-con-codigo reutilizando el código de respaldo que acababa de ser consumido. La consulta en base de datos constató que el código ya registraba una fecha de uso previa, derivando en el rechazo con código 400 Bad Request y mensaje 'Código de recuperación inválido o ya utilizado'. Se corrobora la efectividad del atributo de un solo uso (single-use token) del sistema de respaldo."
    )

    # =========================================================================
    # SECCIÓN 5: Control de Acceso Basado en Roles (RBAC)
    # =========================================================================
    add_section_header("5. Control de Acceso Basado en Roles (RBAC)")
    add_context_p(
        "El control de acceso basado en roles en Veritas AI delimita con precisión las capacidades operativas de cada perfil "
        "(Administrador, Docente Auditor y Estudiante Autor). Los endpoints de auditoría institucional y administración de infraestructura "
        "están vedados para los estudiantes, quienes únicamente pueden interactuar con sus propios recursos académicos."
    )

    add_evidence_figure(
        21,
        "Control RBAC: Consulta legítima de revisiones propias vs bloqueo de auditoría global",
        "figura_21_rbac_consulta_revisiones_propias_vs_global.png",
        "Se evaluó el comportamiento del rol estudiante: la consulta a GET /api/revisiones/mis-revisiones respondió exitosamente con código 200 OK listando las revisiones de integridad académica asociadas al usuario; paralelamente, el intento de consultar el endpoint administrativo global GET /api/revisiones fue rechazado con código 403 Forbidden. La evidencia demuestra la segmentación estricta de dominios de lectura entre usuarios finales y auditores institucionales."
    )

    # =========================================================================
    # SECCIÓN 6: Protección Contra Ataques BOLA / IDOR
    # =========================================================================
    add_section_header("6. Protección Contra Ataques BOLA / IDOR")
    add_context_p(
        "Las vulnerabilidades Broken Object Level Authorization (BOLA/IDOR) representan el riesgo crítico número uno según el Top 10 "
        "de OWASP API Security. En Veritas AI, la consulta o manipulación de una revisión ética específica (/api/revisiones/:id) "
        "requiere que el middleware de propiedad verifique que el solicitante sea efectivamente el autor asignado o el docente auditor tutor."
    )

    add_evidence_figure(
        22,
        "Defensa contra vulnerabilidades BOLA / IDOR en revisiones de integridad académica",
        "figura_22_defensa_bola_acceso_revision_ajena.png",
        "Un estudiante autenticado intentó acceder directamente al registro de revisión GET /api/revisiones/1 perteneciente a otro estudiante. El controlador evaluó la propiedad del recurso confrontando el identificador del autor en la base de datos contra el userId presente en el token JWT, denegando la entrega del registro con código 403 Forbidden. La verificación demuestra que la plataforma neutraliza con éxito riesgos OWASP API1:2023 de autorización a nivel de objeto roto."
    )

    # =========================================================================
    # SECCIÓN 7: Seguridad de API Key y Recursos Desacoplados
    # =========================================================================
    add_section_header("7. Seguridad de API Key y Recursos Desacoplados")
    add_context_p(
        "En cumplimiento de los requerimientos del Bloque 11, se implementó el desacoplamiento entre el control de credenciales de cliente "
        "(X-API-Key) y las sesiones de usuario (JWT). Mientras que los servicios de integración privada exigen obligatoriamente una API Key "
        "institucional activa, las interfaces públicas y los routers académicos operan mediante BearerAuth, permitiendo al frontend web "
        "interactuar de forma limpia y sin obstáculos de cabeceras innecesarias."
    )

    add_evidence_figure(
        23,
        "Seguridad de API Key en recursos de integración privada y desacoplamiento frontend",
        "figura_23_seguridad_api_key_desacoplamiento.png",
        "Se comparó el consumo del endpoint privado GET /api/seguridad/cliente: cuando se omitió la cabecera X-API-Key, el middleware rechazó la llamada con código 401 Unauthorized ('API Key requerida'); al suministrar una API Key institucional válida, el servicio respondió 200 OK exponiendo la identidad del cliente. Simultáneamente, las rutas públicas de frontend (/api/auth/login) operaron sin exigir API Key, ratificando el correcto desacoplamiento de capas del Bloque 11."
    )

    # =========================================================================
    # SECCIÓN 8: Verificación de Preflight CORS para React + Vite
    # =========================================================================
    add_section_header("8. Verificación de Preflight CORS para React + Vite")
    add_context_p(
        "Las aplicaciones web desarrolladas con React y empaquetadas con herramientas como Vite ejecutan habitualmente peticiones "
        "preliminares de sondeo con método HTTP OPTIONS antes de transmitir cabeceras complejas (Authorization, X-API-Key). "
        "El servidor Express debe responder con código 204 No Content y cabeceras permisivas explícitas para el origen del frontend."
    )

    add_evidence_figure(
        24,
        "Validación de solicitud Preflight CORS (OPTIONS) para frontend React + Vite",
        "figura_24_cors_preflight_options_vite_react.png",
        "Se emitió una petición HTTP con método OPTIONS hacia /api/auth/login simulando el preflight del navegador web desde el origen http://localhost:5173. El servidor Express procesó la solicitud respondiendo con código estándar 204 No Content e incluyendo las cabeceras Access-Control-Allow-Origin: http://localhost:5173 y Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS. Esta configuración garantiza la interoperabilidad segura del cliente web de Veritas AI sin interrupciones por políticas de origen cruzado."
    )

    # =========================================================================
    # SECCIÓN 9: Documentación Interactiva OpenAPI / Swagger
    # =========================================================================
    add_section_header("9. Documentación Interactiva OpenAPI / Swagger")
    add_context_p(
        "La arquitectura de software de Veritas AI se encuentra documentada formalmente bajo la especificación OpenAPI 3.0.3, "
        "disponible interactivamente mediante Swagger UI en la ruta /api-docs. Todos los esquemas de seguridad y contratos de los endpoints "
        "del Bloque 11 fueron tipificados con precisión semántica y ejemplos exhaustivos."
    )

    add_evidence_figure(
        25,
        "Documentación interactiva OpenAPI 3.0.3 y Swagger UI en vivo para Veritas AI",
        "figura_25_swagger_ui_openapi_veritas_ai.png",
        "Se capturó directamente la interfaz gráfica interactiva de Swagger UI alojada en http://localhost:5000/api-docs. En ella se aprecia la especificación formal bajo el estándar OpenAPI 3.0.3, la declaración explícita de los esquemas de seguridad BearerAuth (JWT) y ApiKeyAuth (X-API-Key), y la catalogación de los nuevos endpoints del Bloque 11 bajo el tag Autenticación. Esta documentación interactiva permite auditar, probar e integrar los servicios de la plataforma de manera transparente y estandarizada."
    )

    # =========================================================================
    # SECCIÓN 10: Resultados de las Suites de Pruebas Automatizadas
    # =========================================================================
    add_section_header("10. Resultados de las Suites de Pruebas Automatizadas")
    add_context_p(
        "La verificación de regresión y cobertura de seguridad se llevó a cabo mediante la ejecución formal de las suites de prueba "
        "en Jest. Se certificaron al 100% de aprobación tanto la nueva batería del Bloque 11 (26 pruebas) como los conjuntos previos "
        "del Bloque 8 (43 pruebas) y Laboratorio 11 (22 pruebas), totalizando 91 aserciones de integración exitosas."
    )

    add_evidence_figure(
        26,
        "Resultados de ejecución de la suite automatizada Bloque 11 (26/26 pruebas aprobadas)",
        "figura_26_suite_jest_bloque11_aprobada.png",
        "Se ejecutó el ejecutor de pruebas Jest mediante el script npm run test:bloque11 sobre el archivo de pruebas tests/bloque11_veritas.test.ts. El resultado arrojó un total de 26 pruebas ejecutadas y 26 pruebas aprobadas al 100% de manera consecutiva en un tiempo de 55.5 segundos. La suite certifica de modo automatizado la totalidad de los requisitos de revocación de sesiones, recuperación administrativa, códigos de respaldo, RBAC, BOLA, API Key y CORS."
    )

    add_evidence_figure(
        27,
        "Resultados acumulados de las suites de validación Bloque 8 y Lab 11 (65/65 pruebas aprobadas)",
        "figura_27_suite_jest_bloque8_lab11_aprobada.png",
        "Se ejecutaron las suites complementarias de integración npm run test:bloque8 (43 pruebas sobre el modelo educativo, validaciones, agenda y defensa BOLA) y npm run test:lab11 (22 pruebas de autenticación robusta y seguridad relacional). Ambos conjuntos finalizaron con aprobación perfecta (65 de 65 pruebas aprobadas), consolidando un registro histórico global de 91 pruebas exitosas sin fallo alguno. Este balance evidencia la estabilidad y madurez de la arquitectura de ciberseguridad de Veritas AI."
    )

    # =========================================================================
    # SECCIÓN 11: Tabla de Resultados de Pruebas
    # =========================================================================
    add_section_header("11. Tabla de Resultados de Pruebas")
    add_context_p(
        "A continuación, se resume la matriz de verificación técnica de todas las pruebas ejecutadas en Veritas AI durante la auditoría "
        "del Bloque 11. Se especifican el endpoint o consulta, el rol actuante, el código HTTP o resultado obtenido, el estado de "
        "conformidad y la observación técnica correspondiente."
    )

    # Crear tabla compacta
    table_data = [
        # (Prueba, Endpoint/Consulta, Rol, HTTP/Resultado, Estado, Observación)
        ("1. Estructura relacional", "information_schema.tables", "postgres", "9 tablas halladas", "APROBADO", "Tablas académicas y de recuperación persistidas"),
        ("2. Roles institucionales", "public.roles", "postgres", "admin, docente, estudiante", "APROBADO", "Roles activos en dominio Veritas AI"),
        ("3. Catálogo RLS", "pg_class.relrowsecurity", "postgres", "true en 9 tablas", "APROBADO", "Seguridad por filas habilitada en motor"),
        ("4. Columna version_sesion", "public.usuarios", "postgres", "INT NOT NULL DEFAULT 1", "APROBADO", "Soporte para trazabilidad de sesión en BD"),
        ("5. Conexión de backend", "pg_roles.rolbypassrls", "postgres", "rolbypassrls = true", "APROBADO", "Demuestra primacía del middleware Express"),
        ("6. Login válido estudiante", "POST /api/auth/login", "Estudiante", "HTTP 200 OK (vs: 1)", "APROBADO", "JWT firmado con claim de sesión integrado"),
        ("7. Login con clave errónea", "POST /api/auth/login", "Anónimo", "HTTP 401 Unauthorized", "APROBADO", "Protección contra enumeración de credenciales"),
        ("8. Perfil sin credencial", "GET /api/auth/perfil", "Anónimo", "HTTP 401 Unauthorized", "APROBADO", "Middleware intercepta omisión de Bearer token"),
        ("9. Cambio de contraseña", "POST /api/auth/cambiar-password", "Estudiante", "HTTP 200 OK (vs -> 2)", "APROBADO", "Actualización atómica de clave y version_sesion"),
        ("10. Revocación de sesión previa", "GET /api/auth/perfil", "Estudiante (vs=1)", "HTTP 401 Sesión revocada", "APROBADO", "Invalida de inmediato tokens emitidos antes"),
        ("11. Login con nueva clave", "POST /api/auth/login", "Estudiante", "HTTP 200 OK (vs: 2)", "APROBADO", "Emisión de nueva credencial sincronizada"),
        ("12. Cambio con clave errónea", "POST /api/auth/cambiar-password", "Estudiante", "HTTP 401 Unauthorized", "APROBADO", "Evita manipulación no autorizada de clave"),
        ("13. Emisión token admin", "POST /api/auth/recuperacion/admin/:id", "Administrador", "HTTP 201 Created (64 hex)", "APROBADO", "Token temporal SHA-256 válido por 15 min"),
        ("14. Restablecer con token", "POST /api/auth/restablecer-password", "Estudiante", "HTTP 200 OK", "APROBADO", "Consumo seguro e invalidación de token"),
        ("15. Reuso token consumido", "POST /api/auth/restablecer-password", "Estudiante", "HTTP 400 Bad Request", "APROBADO", "Bloquea ataques de repetición de token"),
        ("16. Estudiante forzando admin", "POST /api/auth/recuperacion/admin/:id", "Estudiante", "HTTP 403 Forbidden", "APROBADO", "Control RBAC estricto frente a escalamiento"),
        ("17. Generar códigos respaldo", "POST /api/auth/codigos-recuperacion", "Estudiante", "HTTP 201 Created (8 códigos)", "APROBADO", "Códigos únicos almacenados como hash SHA-256"),
        ("18. Saldo códigos respaldo", "GET /api/auth/codigos-recuperacion/estado", "Estudiante", "HTTP 200 OK (8 disp / 0 uso)", "APROBADO", "Auditoría de inventario de contingencia"),
        ("19. Regenerar códigos", "POST /api/auth/codigos-recuperacion/regenerar", "Estudiante", "HTTP 201 Created (8 nuevos)", "APROBADO", "Elimina lote anterior y previene fugas"),
        ("20. Restablecer con código", "POST /api/auth/restablecer-con-codigo", "Estudiante", "HTTP 200 OK", "APROBADO", "Consumo de un solo uso de clave de respaldo"),
        ("21. Reuso código respaldo", "POST /api/auth/restablecer-con-codigo", "Estudiante", "HTTP 400 Bad Request", "APROBADO", "Neutraliza reintento de código ya consumido"),
        ("22. Consulta revisiones propias", "GET /api/revisiones/mis-revisiones", "Estudiante", "HTTP 200 OK", "APROBADO", "Acceso autorizado a sus trabajos y citas"),
        ("23. Consulta auditoría global", "GET /api/revisiones", "Estudiante", "HTTP 403 Forbidden", "APROBADO", "RBAC restringe vista global a administradores"),
        ("24. Acceso a revisión ajena", "GET /api/revisiones/1", "Estudiante ajeno", "HTTP 403 Forbidden", "APROBADO", "Defensa BOLA/IDOR activa a nivel de objeto"),
        ("25. Recurso privado sin API Key", "GET /api/seguridad/cliente", "Anónimo", "HTTP 401 API Key requerida", "APROBADO", "Control perimetral de integraciones privadas"),
        ("26. Recurso privado con API Key", "GET /api/seguridad/cliente", "Cliente privado", "HTTP 200 OK", "APROBADO", "Autorización legítima de cliente institucional"),
        ("27. Preflight CORS React+Vite", "OPTIONS /api/auth/login", "Frontend 5173", "HTTP 204 No Content", "APROBADO", "Cabeceras Allow-Origin y Allow-Methods"),
        ("28. Suite Jest Bloque 11", "tests/bloque11_veritas.test.ts", "CI/CD Automático", "26 / 26 superadas (100%)", "APROBADO", "Certificación automatizada de Bloque 11"),
        ("29. Suite Jest Bloque 8", "tests/bloque8_validacion.test.ts", "CI/CD Automático", "43 / 43 superadas (100%)", "APROBADO", "Certificación de dominio académico y BOLA"),
        ("30. Suite Jest Lab 11", "tests/lab11.test.ts", "CI/CD Automático", "22 / 22 superadas (100%)", "APROBADO", "Certificación acumulada de seguridad"),
    ]

    table = doc.add_table(rows=len(table_data) + 1, cols=6)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    # Anchos de columna en pulgadas (total = 6.5 pulgadas = ancho disponible con márgenes de 1")
    col_widths = [Inches(1.3), Inches(1.5), Inches(0.9), Inches(1.2), Inches(0.8), Inches(1.8)]

    # Encabezados
    headers = ["Prueba", "Endpoint o consulta", "Rol", "HTTP/resultado", "Estado", "Observación"]
    hdr_cells = table.rows[0].cells
    for i, h_text in enumerate(headers):
        hdr_cells[i].text = h_text
        set_cell_background(hdr_cells[i], "0f172a")
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=120, right=120)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            run.font.name = 'Times New Roman'
            run.font.size = Pt(9.0)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0xff, 0xff, 0xff)

    # Filas de datos
    for r_idx, row_values in enumerate(table_data):
        row_cells = table.rows[r_idx + 1].cells
        bg_color = "f8fafc" if r_idx % 2 == 1 else "ffffff"
        for c_idx, val in enumerate(row_values):
            row_cells[c_idx].text = val
            set_cell_background(row_cells[c_idx], bg_color)
            set_cell_margins(row_cells[c_idx], top=70, bottom=70, left=100, right=100)
            p = row_cells[c_idx].paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            
            # Alineación según columna
            if c_idx in [0, 1, 5]:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER

            for run in p.runs:
                run.font.name = 'Times New Roman'
                run.font.size = Pt(8.5)
                if c_idx == 4 and val == "APROBADO":
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(0x05, 0x96, 0x69) # Verde esmeralda
                elif c_idx == 0:
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(0x1e, 0x29, 0x3b)
                else:
                    run.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    # Ajustar ancho de celdas
    for row in table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

    # Espacio después de la tabla
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(8)
    p_sp.paragraph_format.space_after = Pt(8)

    # =========================================================================
    # SECCIÓN 12: Conclusión Técnica
    # =========================================================================
    add_section_header("12. Conclusión Técnica")
    
    add_context_p(
        "La ejecución integral de la auditoría y verificación del Bloque 11 en la plataforma Veritas AI ha certificado la efectividad "
        "del modelo de ciberseguridad defensiva implementado. Las pruebas reales, respaldadas por un índice perfecto del 100% de aprobación "
        "en las suites automatizadas de Jest (91 pruebas en total), acreditan que cada vector de vulnerabilidad identificado en los "
        "lineamientos de la actividad fue mitigado de forma exhaustiva conforme a los más rigurosos estándares de la industria (OWASP API Security Top 10)."
    )

    add_context_p(
        "Un análisis de particular trascendencia técnica revelado durante las pruebas de auditoría relacional radica en la dualidad entre "
        "las políticas de Row Level Security (RLS) en PostgreSQL y los middlewares de autorización en Express. Al comprobarse mediante "
        "la consulta de auditoría que la conexión entre el backend y PostgreSQL opera bajo el superusuario 'postgres' (el cual posee el flag "
        "rolbypassrls = true habilitado por naturaleza en instancias gestionadas y en contenedores de desarrollo), se demuestra que las "
        "políticas RLS del motor no actúan como filtro restrictivo sobre las consultas originadas por el pool de la aplicación. Por consiguiente, "
        "la defensa en profundidad de Veritas AI depende indefectiblemente de la rigurosidad con que los middlewares de la aplicación "
        "(auth.middleware.ts, roles.middleware.ts, propiedad.middleware.ts y apiKeyMiddleware.ts) fiscalizan cada solicitud."
    )

    add_context_p(
        "En esta arquitectura desacoplada, la capa de aplicación en Express asume el rol fundamental de árbitro de seguridad: "
        "1) el control de estado de sesión mediante version_sesion neutraliza el riesgo de tokens residuales sin requerir listas de revocación "
        "en memoria o almacenes Redis adicionales; 2) los mecanismos de recuperación administrativa y de códigos de respaldo de un solo uso "
        "preservan la confidencialidad absoluta al almacenar únicamente resúmenes unidireccionales SHA-256; 3) el control de acceso basado en "
        "roles (RBAC) y la validación de pertenencia de objeto (defensa anti-BOLA/IDOR) garantizan que ningún estudiante o docente pueda acceder, "
        "consultar o alterar registros académicos ajenos; y 4) el desacoplamiento de API Key y el manejo estándar de preflight CORS (204 No Content) "
        "aseguran la total compatibilidad con clientes web modernos construidos con React y Vite. Veritas AI dispone así de una infraestructura "
        "robusta, resiliente y estrictamente ajustada a su dominio académico."
    )

    # Guardar documento
    doc.save(DOC_PATH)
    print(f"\nDocumento generado exitosamente en: {DOC_PATH}")

if __name__ == "__main__":
    create_report()
