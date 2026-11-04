# language: es
Característica: Reservas en Salón Lila
  Como clienta quiero agendar un servicio del salón
  y como profesional quiero ver las citas de mi calendario.

  Antecedentes:
    Dado que los datos de prueba fueron reiniciados
    Y que el salón ofrece corte, coloración y manicure
    Y que el horario de las 10:00 ya está ocupado
    Y que los horarios 11:00, 14:00 y 16:00 están libres

  Escenario: Catálogo de servicios
    Dado que abro la app como clienta
    Entonces veo el servicio "Corte"
    Y veo el servicio "Coloración"
    Y veo el servicio "Manicure"

  Escenario: Reserva exitosa
    Dado que abro la app como clienta
    Cuando elijo el servicio "Corte"
    Y continúo al listado de horarios
    Y elijo el horario "11:00"
    Y confirmo la cita
    Entonces veo la confirmación de la reserva
    Cuando voy a mis citas
    Entonces veo una cita de "Corte" a las "11:00"

  Escenario: Horario ya ocupado
    Dado que abro la app como clienta
    Cuando elijo el servicio "Coloración"
    Y continúo al listado de horarios
    Y elijo el horario "10:00"
    Y confirmo la cita
    Entonces veo el error "Ese horario ya está ocupado"
    Y no veo la confirmación de la reserva

  Escenario: Validación sin servicio
    Dado que abro la app como clienta
    Cuando continúo al listado de horarios sin elegir un servicio
    Entonces veo el error "Elige un servicio"
    Y sigo en el catálogo de servicios

  Escenario: Agenda de la profesional
    Dado que abro la app como clienta
    Cuando elijo el servicio "Manicure"
    Y continúo al listado de horarios
    Y elijo el horario "14:00"
    Y confirmo la cita
    Y cambio al rol de profesional
    Entonces veo una cita de "Ana" para "Manicure" a las "14:00"
