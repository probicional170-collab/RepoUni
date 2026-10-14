# RepoUni
repositorio de proyecto tic


PROBLEMATICA A TRATAR

Sistema KDS (Kitchen Display System) para
restaurantes

El proyecto depende 100% de la comunicación en tiempo real. No puede haber botón
"Refrescar".

Contexto de negocio
En restaurantes de comida rápida ("Fast Casual"), las comandas de papel son ineficientes y se pierden. El KDS digitaliza este proceso, enviando los pedidos tomados por los meseros directamente a pantallas en la cocina, ordenados por tiempo de llegada.

    ● Arquitectura: Event-Driven (Basada en eventos) simplificada.

    ● Base de datos: MongoDB o PostgreSQL (JSONB). Aquí funciona bien NoSQL
    porque el "pedido" puede tener estructuras variables de platillos/ingredientes extra.

    ● Librerías clave:
        Backend: SignalR (C#) es obligatorio aquí para la comunicación
        Websocket estable.
        Frontend: React Query o TanStack Query para manejo eficiente del estado
        del servidor en el cliente.

Requisitos técnicos específicos:

    1. WebSockets: al crear una orden (POST /api/orders), el backend debe
    emitir un evento ReceiveOrder a todos los clientes conectados al grupo
    "cocina".
    2. Manejo de colas (FIFO): visualización estricta por hora de llegada. Los
    pedidos viejos deben resaltar en rojo si pasan X minutos.
    3. Diseño responsive (tablet): la vista de cocina debe tener botones grandes
    (touch-friendly) y alto contraste para ser usada en tablets/pantallas táctiles.

Módulos principales
    1. Terminal del mesero (móvil/tablet): interfaz táctil rápida para seleccionar mesa, platillos, modificadores (ej. "Sin cebolla") y enviar la orden.
    
    2. Pantalla de cocina (KDS Web View): interfaz de alto contraste para monitores grandes. Muestra "Tickets" digitales. Debe tener temporizadores visuales (ej.cambia a color rojo si lleva más de 15 min).

    3. Gestor de menú (admin): CRUD para activar/desactivar platillos (manejo de stockbásico: si se acaba la carne, no se puede pedir hamburguesa).

Flujo crítico
1. Mesero ingresa orden en celular.
2. Inmediatamente aparece en la pantalla de cocina (sin refresh).
3. Cocinero marca "Preparando".
4. Cocinero marca "Listo para servir".
5. Mesero recibe notificación.

Reto técnico (frontend & real-time)

Sincronización total en tiempo real. El uso de SignalR (C#) o Socket.io es obligatorio. La UI de cocina debe ser capaz de gestionar múltiples pedidos entrantes simultáneamente sin colapsar visualmente.

Desglose mensual:

● Mes 1 (menú & pedidos): CRUD de platillos y mesas. API para crear una orden.
Base de datos estructurada para manejar "cabecera y detalle" de pedido.
● Mes 2 (tiempo real): implementación de SignalR (.NET) o Socket.io. Al crear
pedido, la pantalla de cocina se actualiza sola sin recargar (F5). Cambio de
estados (Pendiente -> Cocinando -> Listo).
● Mes 3 (cliente móvil): interfaz responsive para que el mesero seleccione mesa y platillos. Reporte de "Platillos más vendidos". Pruebas de estrés (múltiples pedidos simultáneos).


