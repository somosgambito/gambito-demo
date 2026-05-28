// ═══════════════════════════════════════════════
// gamb1t0_ · CORE STATE ENGINE v1.0
// Importar en cada pantalla: <script src="gbt_core.js"></script>
// ═══════════════════════════════════════════════

const GBT = {

  WEBHOOK: 'https://script.google.com/macros/s/AKfycbyOx_wAaW3jlWMJT36Pr52xd86GivGc0lpghmc9tN9FrQSDYFJb1z8q4f9mJJUnnh2x/exec',

  // ── LEER / ESCRIBIR ──
  get(key, def=null){
    try{ const v=localStorage.getItem('gbt_'+key); return v!==null?JSON.parse(v):def; }
    catch(e){ return def; }
  },
  set(key,val){ localStorage.setItem('gbt_'+key, JSON.stringify(val)); },

  // ── PLAYER ──
  player(){ return this.get('player',{}); },

  // ── NIVEL ──
  nivel(xp){ return xp<200?1:xp<500?2:xp<1000?3:xp<2000?4:xp<4000?5:Math.floor(xp/1000)+1; },

  // ── ENERGÍA ──
  ENERGIA_BASE: 100,
  energiaMax(nivel){ return this.ENERGIA_BASE + (nivel-1)*10; },

  getEnergia(){
    const last = this.get('energia_ts', null);
    let energia = this.get('energia', null);
    const xp = this.get('xp',100);
    const max = this.energiaMax(this.nivel(xp));

    if(energia === null){ energia = max; this.set('energia', energia); }

    if(last){
      const ahora = Date.now();
      const diff = ahora - last;
      const horas = diff / 3600000;
      const ahora_h = new Date().getHours();
      const last_h = new Date(last).getHours();

      // recuperación nocturna 23:00 - 7:00 → 12.5 pts/hora
      // recuperación diurna → 4 pts/hora (lenta, el cuerpo descansa menos)
      let recup = 0;
      if(horas > 0){
        const es_noche = (ahora_h >= 23 || ahora_h < 7);
        const tasa = es_noche ? 12.5 : 4;
        recup = horas * tasa;
      }
      energia = Math.min(max, energia + recup);
      this.set('energia', Math.round(energia*10)/10);
    }
    this.set('energia_ts', Date.now());
    return Math.round(energia*10)/10;
  },

  consumirEnergia(cantidad){
    const e = this.getEnergia();
    const nueva = Math.max(0, e - cantidad);
    this.set('energia', nueva);
    this.set('energia_ts', Date.now());
    return nueva;
  },

  // CONSUMO POR ACTIVIDAD
  CONSUMO: {
    mision_facil: 5,
    mision_media: 10,
    mision_dificil: 18,
    duelo: 14,
    skill_nodo: 4,
    descanso: -15, // recupera
  },

  // ESTADO ENERGÍA
  estadoEnergia(e, max){
    const pct = e/max*100;
    if(pct > 80) return {label:'óptimo',color:'#00c896',bonus:1.1,bloqueo:false};
    if(pct > 50) return {label:'normal',color:'#c9a84c',bonus:1.0,bloqueo:false};
    if(pct > 20) return {label:'cansado',color:'#ff9040',bonus:0.8,bloqueo:false};
    return {label:'agotado',color:'#ff4d6d',bonus:0.5,bloqueo:true};
  },

  // ── STATS ──
  getStats(){
    return {
      xp:    this.get('xp',100),
      gus:   this.get('gus',50),
      tokens:this.get('tokens',120),
      energia: this.getEnergia(),
    };
  },

  addXP(n){
    const xp = this.get('xp',100) + n;
    this.set('xp', xp);
    return xp;
  },
  addGUS(n){
    const gus = this.get('gus',50) + n;
    this.set('gus', gus);
    return gus;
  },
  useTokens(n){
    const tok = Math.max(0, this.get('tokens',120) - n);
    this.set('tokens', tok);
    return tok;
  },

  // ── TRABAJOS ──
  TRABAJOS: [
    {
      id:'delivery',
      name:'delivery digital',
      desc:'reparte códigos y mensajes en el universo gamb1t0 — rápido, sin errores',
      duracion_dias:1,
      nivel_min:1,
      cupos_total:10,
      umbral_aprobacion:4, // de 5
      gus_base:80,
      xp_bonus:60,
      icon:'📦',
      color:'#00c896',
      preguntas:[
        {p:'un cliente pide su pedido urgente pero ya cerraste tu turno — ¿qué haces?',
         opts:['lo ignoro — ya cerré','le digo que lo atienda el siguiente turno explicando por qué','lo atiendo igual aunque no me paguen extra','le doy el contacto de otro repartidor'],
         ok:1},
        {p:'llegas a la dirección y nadie responde — ¿cuál es tu siguiente paso?',
         opts:['te vas y marcas como entregado','esperas 5 min, llamas 2 veces, dejas nota y reportas','devuelves el pedido inmediatamente','lo dejas en la puerta sin avisar'],
         ok:1},
        {p:'tienes 3 entregas simultáneas — ¿cómo las priorizas?',
         opts:['la que queda más cerca de tu casa','la más cara primero','por distancia y tiempo prometido al cliente','la que tiene mejor propina'],
         ok:2},
        {p:'un cliente dice que no recibió su pedido pero tú lo entregaste — ¿qué haces?',
         opts:['discutes y le dices que miente','le muestras evidencia de entrega y escalas al soporte','le devuelves el GUS sin preguntar','lo bloqueas'],
         ok:1},
        {p:'¿cuál es la habilidad más importante para este trabajo?',
         opts:['ser rápido sin importar nada más','comunicación clara y puntualidad','conocer todas las calles de memoria','tener el teléfono con batería siempre'],
         ok:1},
      ],
    },
    {
      id:'community',
      name:'community manager',
      desc:'activa y modera el clan — conectas jugadores, resuelves conflictos, generas movimiento',
      duracion_dias:2,
      nivel_min:2,
      cupos_total:6,
      umbral_aprobacion:4,
      gus_base:180,
      xp_bonus:120,
      icon:'📣',
      color:'#7f6af0',
      preguntas:[
        {p:'un jugador insulta a otro en el chat del clan — ¿qué haces primero?',
         opts:['los baneas a los dos por si acaso','contactas al que insultó en privado antes de cualquier acción pública','ignoras — son cosas de jugadores','haces un post público exponiendo al que insultó'],
         ok:1},
        {p:'el clan lleva 3 días sin actividad — ¿cómo lo reactivas?',
         opts:['mandas un mensaje genérico de "hola a todos"','propones un reto específico con recompensa clara y tiempo límite','esperas a que alguien más lo reactive','culpas a los inactivos públicamente'],
         ok:1},
        {p:'un nuevo jugador pregunta cómo funciona el juego por tercera vez — ¿qué haces?',
         opts:['le dices que lea el manual','creas un mensaje fijo de bienvenida con los 3 puntos clave','lo ignoras — ya le explicaron','lo mandas a buscar en Google'],
         ok:1},
        {p:'recibes críticas de jugadores sobre una decisión que tomaste — ¿cuál es tu respuesta?',
         opts:['defiendes tu decisión sin escuchar','escuchas, reconoces lo válido y explicas tu razonamiento','cambias todo para no tener conflictos','eliminas los comentarios negativos'],
         ok:1},
        {p:'¿cuál es la métrica más importante para saber si tu trabajo funciona?',
         opts:['cuántos mensajes mandaste','cuántos jugadores activos hay esta semana vs la anterior','cuántos te siguen a ti personalmente','cuántas quejas no recibiste'],
         ok:1},
      ],
    },
    {
      id:'disenador',
      name:'diseñador de skins',
      desc:'crea una skin nueva para el market — concepto, descripción y valor — los jugadores la votarán',
      duracion_dias:3,
      nivel_min:3,
      cupos_total:4,
      umbral_aprobacion:5, // debe ser 5/5
      gus_base:320,
      xp_bonus:200,
      icon:'🎨',
      color:'#c9a84c',
      preguntas:[
        {p:'te piden diseñar una skin para un guerrero de nivel 5 — ¿por dónde empiezas?',
         opts:['copias la primera imagen que encuentras en internet','defines primero qué emoción debe provocar en el jugador al verla','haces algo rápido porque total nadie va a comprarla','le preguntas al cliente qué colores le gustan'],
         ok:1},
        {p:'tu primer diseño es rechazado — ¿cuál es tu reacción?',
         opts:['te enojas y dices que el cliente no entiende','preguntas exactamente qué no funcionó y propones una nueva dirección','abandonas el proyecto','aceptas sin entender por qué y repites el mismo error'],
         ok:1},
        {p:'tienes que elegir entre una skin muy original pero difícil de entender o una clara pero común — ¿cuál eliges para el market?',
         opts:['la original siempre — el arte no se explica','la común — se vende más','propones las dos y dejas que los jugadores voten','ninguna — pides más tiempo'],
         ok:2},
        {p:'¿cómo sabes si una skin tiene valor real para los jugadores?',
         opts:['si a ti te gusta personalmente','si genera reacción cuando la ven por primera vez','si tardaste mucho en hacerla','si tiene muchos colores'],
         ok:1},
        {p:'un jugador de nivel 1 quiere comprar tu skin de nivel 5 — ¿qué le dices?',
         opts:['no puede — punto','le explicas qué logros necesita para desbloquearla y lo motivas a seguir','le vendes igual — el GUS es el GUS','lo ignoras'],
         ok:1},
      ],
    },
  ],

  getTrabajoActivo(){
    const t = this.get('trabajo_activo', null);
    if(!t) return null;
    const ahora = Date.now();
    if(ahora > t.fin_ts){
      // trabajo completado automáticamente
      this.completarTrabajo(t);
      return null;
    }
    return t;
  },

  iniciarTrabajo(trabajoId, respuestas_correctas){
    const trabajo = this.TRABAJOS.find(t=>t.id===trabajoId);
    if(!trabajo) return false;
    const ahora = Date.now();
    const fin = ahora + trabajo.duracion_dias * 24 * 3600 * 1000;
    const t = {
      id: trabajoId,
      inicio_ts: ahora,
      fin_ts: fin,
      gus_acordado: trabajo.gus_base,
      avisado_salida: false,
    };
    this.set('trabajo_activo', t);
    return t;
  },

  abandonarTrabajo(avisar){
    const t = this.get('trabajo_activo', null);
    if(!t) return;
    const trabajo = this.TRABAJOS.find(x=>x.id===t.id);
    const ahora = Date.now();
    const total = t.fin_ts - t.inicio_ts;
    const transcurrido = ahora - t.inicio_ts;
    const pct = Math.min(transcurrido/total, 1);

    if(avisar){
      // descuento proporcional al tiempo restante
      const gus_ganado = Math.floor(t.gus_acordado * pct * 0.85);
      this.addGUS(gus_ganado);
      this.set('trabajo_activo', null);
      return {gus: gus_ganado, msg:'avisaste a tiempo — recibiste '+gus_ganado+' GUS'};
    } else {
      // pierde todo lo acumulado
      this.set('trabajo_activo', null);
      return {gus: 0, msg:'saliste sin avisar — perdiste el GUS acumulado'};
    }
  },

  completarTrabajo(t){
    const trabajo = this.TRABAJOS.find(x=>x.id===t.id);
    if(!trabajo) return;
    this.addGUS(trabajo.gus_base);
    this.addXP(trabajo.xp_bonus);
    this.set('trabajo_activo', null);
    this.set('trabajo_completado_'+t.id, true);
  },

  // CUPOS (simulados + Google Sheets)
  getCuposOcupados(trabajoId){
    // simulado con variación realista para urgencia
    const base = {delivery:7, community:4, disenador:2};
    return base[trabajoId]||0;
  },

  // ── WEBHOOK ──
  async enviar(datos){
    try{
      await fetch(this.WEBHOOK,{
        method:'POST',mode:'no-cors',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...datos, fuente:'demo_gambito', ts:new Date().toISOString()})
      });
    }catch(e){}
  },

};

// Exponer globalmente
window.GBT = GBT;
