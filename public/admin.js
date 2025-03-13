$(document).ready(function () {
    const API_URL = 'http://localhost:3000/api';
    let resimler = [];

    // Token kontrolü
    const token = localStorage.getItem('adminToken');
    const username = localStorage.getItem('adminUsername');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Kullanıcı adını göster
    $('#welcomeMessage').text(`Hoş geldin, ${username || 'Admin'}`);

    // Resimleri API'den çek
    function resimleriGetir() {
        $.ajax({
            url: `${API_URL}/images`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function(data) {
                resimler = data;
                resimleriListele();
            },
            error: function(err) {
                console.error('Resimler yüklenirken hata oluştu:', err);
                // Hata 401 (Unauthorized) ise login sayfasına yönlendir
                if (err.status === 401) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUsername');
                    window.location.href = 'login.html';
                    return;
                }
                // Hata durumunda LocalStorage'dan yükle
                resimler = JSON.parse(localStorage.getItem('sliderResimleri')) || [
                    { url: "kedi.jpg" },
                    { url: "4.jpg" },
                    { url: "6.jpg" }
                ];
                resimleriListele();
            }
        });
    }

    // Resimleri listeleme fonksiyonu
    function resimleriListele() {
        let html = "";
        resimler.forEach((resim, index) => {
            html += `
                <tr>
                    <td><img src="${resim.url}" alt="Resim ${index + 1}" class="img-thumbnail"></td>
                    <td>${resim.url}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="resimSil('${resim._id || index}')">Sil</button>
                    </td>
                </tr>
            `;
        });
        $("#resimListesi").html(html);
        
        // Yedek olarak LocalStorage'a da kaydet
        localStorage.setItem('sliderResimleri', JSON.stringify(resimler));
    }

    // Resim ekleme fonksiyonu
    $("#resimEkleForm").submit(function (e) {
        e.preventDefault();

        // URL ile resim ekleme
        let resimUrl = $("#resimUrl").val();

        // Dosya yükleme ile resim ekleme
        let resimDosya = $("#resimDosya")[0].files[0];

        if (resimUrl) {
            // URL varsa API'ye gönder
            $.ajax({
                url: `${API_URL}/images`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                contentType: 'application/json',
                data: JSON.stringify({ url: resimUrl }),
                success: function(data) {
                    resimleriGetir(); // Resimleri yeniden yükle
                    $("#resimUrl").val(""); // Formu temizle
                },
                error: function(err) {
                    console.error('Resim eklenirken hata oluştu:', err);
                    // Hata 401 (Unauthorized) ise login sayfasına yönlendir
                    if (err.status === 401) {
                        localStorage.removeItem('adminToken');
                        localStorage.removeItem('adminUsername');
                        window.location.href = 'login.html';
                        return;
                    }
                    alert('Resim eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
                }
            });
        } else if (resimDosya) {
            // Dosya yüklendiyse, resmi base64'e çevir ve API'ye gönder
            let reader = new FileReader();
            reader.onload = function (e) {
                $.ajax({
                    url: `${API_URL}/images`,
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    contentType: 'application/json',
                    data: JSON.stringify({ url: e.target.result }),
                    success: function(data) {
                        resimleriGetir(); // Resimleri yeniden yükle
                        $("#resimDosya").val(""); // Formu temizle
                    },
                    error: function(err) {
                        console.error('Resim eklenirken hata oluştu:', err);
                        // Hata 401 (Unauthorized) ise login sayfasına yönlendir
                        if (err.status === 401) {
                            localStorage.removeItem('adminToken');
                            localStorage.removeItem('adminUsername');
                            window.location.href = 'login.html';
                            return;
                        }
                        alert('Resim eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
                    }
                });
            };
            reader.readAsDataURL(resimDosya);
        } else {
            alert("Lütfen bir resim URL'si girin veya bir dosya seçin.");
        }
    });

    // Resim silme fonksiyonu
    window.resimSil = function (id) {
        if (id.toString().length > 5) {
            // MongoDB ID ise API'den sil
            $.ajax({
                url: `${API_URL}/images/${id}`,
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                success: function() {
                    resimleriGetir(); // Resimleri yeniden yükle
                },
                error: function(err) {
                    console.error('Resim silinirken hata oluştu:', err);
                    // Hata 401 (Unauthorized) ise login sayfasına yönlendir
                    if (err.status === 401) {
                        localStorage.removeItem('adminToken');
                        localStorage.removeItem('adminUsername');
                        window.location.href = 'login.html';
                        return;
                    }
                    alert('Resim silinirken bir hata oluştu. Lütfen tekrar deneyin.');
                }
            });
        } else {
            // LocalStorage'dan sil (yedek yöntem)
            resimler.splice(id, 1);
            resimleriListele();
        }
    };

    // Sayfa yüklendiğinde resimleri getir
    resimleriGetir();
});