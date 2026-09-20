/* =========================================================
   NOVA — Checkout form translations (shared)
   The Spanish texts below are the DEFAULT checkout language.
   Admins can override them (to any language) from the product
   editor; order.js fetches the overrides from GET /api/i18n.
   ========================================================= */
window.NOVA_I18N_DEFAULTS = {
  /* form / personal data */
  ck_cod_title: 'Contra reembolso',
  ck_cod_sub: 'Paga en efectivo cuando recibas tu pedido. Sin tarjeta, sin riesgo.',
  ck_prod_label: 'Producto',
  fields_head: 'Completa tus datos',
  fields_sub: 'Rellena la siguiente información para que podamos preparar y enviar tu pedido.',
  name_label: 'Nombre completo',
  name_ph: 'Nombre y apellidos',
  phone_label: 'Teléfono',
  phone_ph: 'Ej: 612 34 56 78',
  phone_hint: 'Solo lo usamos para confirmar tu entrega.',

  /* address */
  ship_title: '¿Dónde enviamos tu pedido?',
  city_label: 'Ciudad',
  city_ph: 'Madrid',
  city_hint: 'Se rellena automáticamente con tu código postal.',
  street_label: 'Calle y número',
  street_ph: 'Gran Vía, 15',
  prov_label: 'Provincia',
  prov_ph: 'Ej: Madrid',
  zip_label: 'Código postal',
  zip_ph: '28013',

  /* map */
  map_toggle: '¿No sabes tu dirección exacta? Búscala en el mapa o usa tu ubicación',
  search_ph: 'Busca una calle o un barrio…',
  loc_use: 'Usar mi ubicación',
  loc_hint: 'Elige la opción que aparezca o usa tu ubicación — el mapa saltará a tu punto exacto.',

  /* payment / submit */
  pay_label: 'Total a pagar al recibir',
  submit: 'Realizar pedido',
  submit_sending: 'Enviando pedido…',

  /* errors */
  err_required_name_phone: 'Completa tu nombre y tu teléfono.',
  err_required_street: 'Indica la calle y el número de tu dirección.',
  err_required_zip: 'Escribe tu código postal (5 dígitos).',
  err_zip_format: 'El código postal debe tener 5 dígitos.',
  err_required_city: 'Escribe tu ciudad.',
  err_generic: 'Algo salió mal (HTTP {status}). Inténtalo de nuevo.',
  search_not_found: 'No hemos encontrado "{q}". Prueba con un barrio, calle o ciudad.',
  locate_no_geo: 'Tu navegador no permite ubicación. Escribe tu dirección.',
  locate_locating: 'Localizando…',
  locate_fail: 'No pudimos obtener tu ubicación. Escribe tu calle o elige una sugerencia.',
  meta_title: 'Finalizar pedido',

  /* success page */
  ok_title: '¡Pedido confirmado!',
  ok_ref: 'Referencia',
  ok_product: 'Producto',
  ok_total: 'Total a pagar al recibir',
  ok_method: 'Método de pago',
  ok_cod: 'Contra reembolso',
  ok_delivery_title: 'Datos de entrega',
  ok_name: 'Nombre',
  ok_phone: 'Teléfono',
  ok_address: 'Dirección',
  ok_note: 'Te contactaremos en breve para coordinar la entrega de tu pedido.',
  ok_continue: 'Seguir comprando',
  ok_home: 'Volver al inicio',

  /* no-product page */
  np_title: 'Algo salió mal',
  np_notfound: 'No hemos encontrado ese producto o ya no está disponible.',
  np_back_shop: 'Volver a la tienda',
};

window.NOVA_I18N_FIELDS = [
  { group: 'form', key: 'ck_cod_title', ar: 'عنوان صندوق «الدفع عند الاستلام»' },
  { group: 'form', key: 'ck_cod_sub', ar: 'الوصف تحت العنوان' },
  { group: 'form', key: 'ck_prod_label', ar: 'كلمة «المنتج» (بجانب الكمية)' },
  { group: 'form', key: 'fields_head', ar: 'العنوان الرئيسي للنموذج' },
  { group: 'form', key: 'fields_sub', ar: 'النص التعريفي للنموذج' },
  { group: 'form', key: 'name_label', ar: 'تسمية الاسم الكامل' },
  { group: 'form', key: 'name_ph', ar: 'Placeholder الاسم' },
  { group: 'form', key: 'phone_label', ar: 'تسمية الهاتف' },
  { group: 'form', key: 'phone_ph', ar: 'Placeholder الهاتف' },
  { group: 'form', key: 'phone_hint', ar: 'سطر المساعدة للهاتف' },

  { group: 'address', key: 'ship_title', ar: 'عنوان قسم العنوان' },
  { group: 'address', key: 'city_label', ar: 'تسمية المدينة' },
  { group: 'address', key: 'city_ph', ar: 'Placeholder المدينة' },
  { group: 'address', key: 'city_hint', ar: 'سطر المساعدة للمدينة' },
  { group: 'address', key: 'street_label', ar: 'تسمية الشارع والرقم' },
  { group: 'address', key: 'street_ph', ar: 'Placeholder الشارع' },
  { group: 'address', key: 'prov_label', ar: 'تسمية المقاطعة' },
  { group: 'address', key: 'prov_ph', ar: 'Placeholder المقاطعة' },
  { group: 'address', key: 'zip_label', ar: 'تسمية الرمز البريدي' },
  { group: 'address', key: 'zip_ph', ar: 'Placeholder الرمز البريدي' },

  { group: 'map', key: 'map_toggle', ar: 'زر فتح الخريطة' },
  { group: 'map', key: 'search_ph', ar: 'Placeholder بحث العنوان' },
  { group: 'map', key: 'loc_use', ar: 'زر «استخدم موقعي»' },
  { group: 'map', key: 'loc_hint', ar: 'تلميح الخريطة' },

  { group: 'pay', key: 'pay_label', ar: 'تسمية «الإجمالي عند الاستلام»' },
  { group: 'pay', key: 'submit', ar: 'زر إرسال الطلب' },
  { group: 'pay', key: 'submit_sending', ar: 'نص الزر أثناء الإرسال' },

  { group: 'errors', key: 'err_required_name_phone', ar: 'خطأ: الاسم/الهاتف فارغان' },
  { group: 'errors', key: 'err_required_street', ar: 'خطأ: الشارع فارغ' },
  { group: 'errors', key: 'err_required_zip', ar: 'خطأ: الرمز البريدي فارغ' },
  { group: 'errors', key: 'err_zip_format', ar: 'خطأ: صيغة الرمز البريدي' },
  { group: 'errors', key: 'err_required_city', ar: 'خطأ: المدينة فارغة' },
  { group: 'errors', key: 'err_generic', ar: 'خطأ عام (استخدم {status}؟)' },
  { group: 'errors', key: 'search_not_found', ar: 'خطأ: لم نجد البحث (استخدم {q}?)' },
  { group: 'errors', key: 'locate_no_geo', ar: 'خطأ: الموقع غير مدعوم' },
  { group: 'errors', key: 'locate_locating', ar: 'نص «جارٍ التحديد»' },
  { group: 'errors', key: 'locate_fail', ar: 'خطأ: فشل تحديد الموقع' },
  { group: 'errors', key: 'meta_title', ar: 'عنوان تبويب المتصفح' },

  { group: 'success', key: 'ok_title', ar: 'عنوان النجاح' },
  { group: 'success', key: 'ok_ref', ar: 'كلمة «المرجع»' },
  { group: 'success', key: 'ok_product', ar: '«المنتج» في ملخص النجاح' },
  { group: 'success', key: 'ok_total', ar: '«الإجمالي عند الاستلام»' },
  { group: 'success', key: 'ok_method', ar: '«طريقة الدفع»' },
  { group: 'success', key: 'ok_cod', ar: '«الدفع عند الاستلام»' },
  { group: 'success', key: 'ok_delivery_title', ar: 'عنوان «بيانات التوصيل»' },
  { group: 'success', key: 'ok_name', ar: '«الاسم»' },
  { group: 'success', key: 'ok_phone', ar: '«الهاتف»' },
  { group: 'success', key: 'ok_address', ar: '«العنوان»' },
  { group: 'success', key: 'ok_note', ar: 'ملاحظة النجاح' },
  { group: 'success', key: 'ok_continue', ar: 'زر «متابعة التسوق»' },
  { group: 'success', key: 'ok_home', ar: 'زر «العودة للرئيسية»' },

  { group: 'misc', key: 'np_title', ar: 'عنوان «حدث خطأ» (منتج غير موجود)' },
  { group: 'misc', key: 'np_notfound', ar: 'رسالة المنتج غير موجود' },
  { group: 'misc', key: 'np_back_shop', ar: 'زر «العودة للمتجر»' },
];

window.NOVA_I18N_GROUPS = {
  form: 'البيانات الشخصية',
  address: 'العنوان',
  map: 'الخريطة',
  pay: 'الدفع / الزر',
  errors: 'رسائل الخطأ',
  success: 'صفحة النجاح',
  misc: 'أخرى',
};