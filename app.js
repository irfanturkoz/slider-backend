app.use(express.json());
app.use(cors());

// Statik dosyalar için public klasörünü kullan
app.use(express.static('public')); 