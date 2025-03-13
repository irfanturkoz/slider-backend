$(document).ready(function () {
    // API URL'sini dinamik olarak belirle
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000/api' 
        : 'https://slider-backend.onrender.com/api'; // Backend API domain'inizi buraya yazın
    
    let resimler = [];
    let kullanicilar = [];
    let currentUserIsSuperAdmin = false;

    // Token kontrolü
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Kullanıcı bilgilerini kontrol et
    checkUserStatus();

    // Kullanıcı durumunu kontrol et
    function checkUserStatus() {
        $.ajax({
            url: `${API_URL}/auth/profile`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function(response) {
                currentUserIsSuperAdmin = response.isSuperAdmin;
                const welcomeText = `Hoş geldin, ${response.username}`;
                const badges = [];
                
                if (response.isSuperAdmin) {
                    badges.push('<span class="badge badge-danger ml-2">Süper Admin</span>');
                    $("#superAdminCheckboxContainer").show();
                } else if (response.isAdmin) {
                    badges.push('<span class="badge badge-primary ml-2">Admin</span>');
                }
                
                $("#welcomeMessage").html(welcomeText + badges.join(''));
                
                // Sayfa yüklendiğinde resimleri ve kullanıcıları getir
                resimleriGetir();
                kullanicilariGetir();
            },
            error: function(err) {
                console.error('Kullanıcı bilgileri alınamadı:', err);
                if (err.status === 401) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUsername');
                    window.location.href = 'login.html';
                }
            }
        });
    }

    // Şifre değiştirme işlemleri
    $("#changePasswordBtn").click(function() {
        $("#changePasswordForm")[0].reset();
        $("#passwordErrorAlert").hide();
        $("#passwordSuccessAlert").hide();
        $("#changePasswordModal").modal('show');
    });

    $("#savePasswordBtn").click(function() {
        const currentPassword = $("#currentPassword").val();
        const newPassword = $("#newPassword").val();
        const confirmPassword = $("#confirmPassword").val();

        if (!currentPassword || !newPassword || !confirmPassword) {
            $("#passwordErrorAlert").text("Tüm alanları doldurun").show();
            return;
        }

        if (newPassword !== confirmPassword) {
            $("#passwordErrorAlert").text("Yeni şifreler eşleşmiyor").show();
            return;
        }

        $.ajax({
            url: `${API_URL}/auth/change-password`,
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            contentType: 'application/json',
            data: JSON.stringify({ currentPassword, newPassword }),
            success: function(response) {
                $("#passwordErrorAlert").hide();
                $("#passwordSuccessAlert").text("Şifre başarıyla değiştirildi").show();
                setTimeout(() => {
                    $("#changePasswordModal").modal('hide');
                }, 2000);
            },
            error: function(err) {
                if (err.status === 401) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUsername');
                    window.location.href = 'login.html';
                    return;
                }
                $("#passwordErrorAlert").text(err.responseJSON?.message || "Şifre değiştirme başarısız").show();
            }
        });
    });

    // Çıkış yap
    $("#logoutBtn").click(function() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUsername');
        window.location.href = 'login.html';
    });

    // Yeni Kullanıcı Ekle butonu
    $("#addUserBtn").click(function() {
        // Formu temizle
        $("#kullaniciEkleForm")[0].reset();
        $("#userErrorAlert").hide();
        $("#userSuccessAlert").hide();
        
        // Modalı aç
        $("#addUserModal").modal('show');
    });
    
    // Kullanıcı Ekle butonu (modal içinde)
    $("#saveUserBtn").click(function() {
        const username = $("#newUsername").val();
        const password = $("#newUserPassword").val();
        const isAdmin = $("#isAdmin").is(":checked");
        const isSuperAdmin = $("#isSuperAdmin").is(":checked");

        if (!username || !password) {
            $("#userErrorAlert").text("Kullanıcı adı ve şifre gereklidir").show();
            $("#userSuccessAlert").hide();
            return;
        }

        // Süper admin yetkisi verme kontrolü
        if (isSuperAdmin && !currentUserIsSuperAdmin) {
            $("#userErrorAlert").text("Süper admin yetkisi verme yetkiniz yok").show();
            $("#userSuccessAlert").hide();
            return;
        }

        // API'ye kullanıcı ekleme isteği gönder
        $.ajax({
            url: `${API_URL}/auth/register`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            contentType: 'application/json',
            data: JSON.stringify({ 
                username, 
                password,
                isAdmin,
                isSuperAdmin
            }),
            success: function(response) {
                $("#userSuccessAlert").text("Kullanıcı başarıyla eklendi").show();
                $("#userErrorAlert").hide();
                setTimeout(() => {
                    $("#addUserModal").modal('hide');
                    // Kullanıcı listesini güncelle
                    kullanicilariGetir();
                }, 1500);
            },
            error: function(err) {
                let errorMessage = "Kullanıcı eklenirken bir hata oluştu";
                if (err.responseJSON && err.responseJSON.message) {
                    errorMessage = err.responseJSON.message;
                }
                $("#userErrorAlert").text(errorMessage).show();
                $("#userSuccessAlert").hide();
            }
        });
    });

    // Kullanıcı ekleme formu (eski form için, artık kullanılmıyor)
    $("#kullaniciEkleForm").submit(function (e) {
        e.preventDefault();
        // Form submit olayını engelle, artık saveUserBtn tıklaması ile işlem yapılıyor
    });

    // Kullanıcıları API'den çek
    function kullanicilariGetir() {
        $.ajax({
            url: `${API_URL}/auth/users`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function(data) {
                kullanicilar = data;
                kullanicilariListele();
            },
            error: function(err) {
                console.error('Kullanıcılar yüklenirken hata oluştu:', err);
                // Hata 401 (Unauthorized) ise login sayfasına yönlendir
                if (err.status === 401) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUsername');
                    window.location.href = 'login.html';
                    return;
                }
                
                // Hata mesajını göster
                $("#userListErrorAlert").text("Kullanıcılar yüklenirken bir hata oluştu").show();
            }
        });
    }

    // Kullanıcıları listeleme fonksiyonu
    function kullanicilariListele() {
        let html = "";
        kullanicilar.forEach((kullanici) => {
            // Kendi hesabını silme butonunu gösterme
            const currentUsername = localStorage.getItem('adminUsername');
            
            // Silme butonu kontrolü
            let silButonu = '';
            
            if (kullanici.username === currentUsername) {
                silButonu = '<button class="btn btn-secondary btn-sm" disabled>Kendini Silemezsin</button>';
            } else if (kullanici.isSuperAdmin && !currentUserIsSuperAdmin) {
                silButonu = '<button class="btn btn-secondary btn-sm" disabled>Süper Admin Silinemez</button>';
            } else {
                silButonu = `<button class="btn btn-danger btn-sm" onclick="silKullanici('${kullanici._id}')">Sil</button>`;
            }
            
            // Tarih formatını düzenle
            const tarih = new Date(kullanici.createdAt).toLocaleString('tr-TR');
            
            // Süper admin rozeti
            const adminRozet = kullanici.isAdmin 
                ? (kullanici.isSuperAdmin 
                    ? '<span class="badge badge-danger">Süper Admin</span>' 
                    : '<span class="badge badge-success">Evet</span>') 
                : '<span class="badge badge-secondary">Hayır</span>';
            
            html += `
                <tr>
                    <td>${silButonu}</td>
                    <td>${kullanici.username}</td>
                    <td>${adminRozet}</td>
                    <td>${tarih}</td>
                </tr>
            `;
        });
        $("#kullaniciListesi").html(html);
    }

    // Kullanıcı silme fonksiyonu - Global olarak tanımla
    function silKullanici(id) {
        if (confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
            $.ajax({
                url: `${API_URL}/auth/users/${id}`,
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                success: function() {
                    // Başarı mesajını göster
                    $("#userListSuccessAlert").text("Kullanıcı başarıyla silindi").show();
                    $("#userListErrorAlert").hide();
                    
                    // Kullanıcı listesini güncelle
                    kullanicilariGetir();
                    
                    // 3 saniye sonra mesajı gizle
                    setTimeout(function() {
                        $("#userListSuccessAlert").hide();
                    }, 3000);
                },
                error: function(err) {
                    console.error('Kullanıcı silinirken hata oluştu:', err);
                    // Hata 401 (Unauthorized) ise login sayfasına yönlendir
                    if (err.status === 401) {
                        localStorage.removeItem('adminToken');
                        localStorage.removeItem('adminUsername');
                        window.location.href = 'login.html';
                        return;
                    }
                    
                    // Hata mesajını göster
                    $("#userListErrorAlert").text(err.responseJSON?.message || "Kullanıcı silinirken bir hata oluştu").show();
                    $("#userListSuccessAlert").hide();
                }
            });
        }
    }
    
    // Global olarak silKullanici fonksiyonunu tanımla
    window.silKullanici = silKullanici;

    // Kullanıcı silme fonksiyonu (eski, artık kullanılmıyor)
    window.kullaniciSil = function(id) {
        silKullanici(id);
    };

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
                    { url: "6.jpg" },
                    { url: "resim1.jpg" },
                    { url: "resim2.jpg" },
                    { url: "resim3.jpg" }
                ];
                resimleriListele();
            }
        });
    }

    // Resimleri listeleme fonksiyonu
    function resimleriListele() {
        let html = "";
        // Resimleri sıraya göre sırala
        resimler.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        resimler.forEach((resim, index) => {
            html += `
                <tr>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-danger btn-sm" onclick="resimSil('${resim._id}')">Sil</button>
                            <button class="btn btn-primary btn-sm" onclick="sirayiDegistir('${resim._id}', 'up')" ${index === 0 ? 'disabled' : ''}>↑</button>
                            <button class="btn btn-primary btn-sm" onclick="sirayiDegistir('${resim._id}', 'down')" ${index === resimler.length - 1 ? 'disabled' : ''}>↓</button>
                        </div>
                    </td>
                    <td>${index + 1}</td>
                    <td><img src="${resim.url}" alt="Resim ${index + 1}" class="img-thumbnail" style="max-height: 100px;"></td>
                    <td>${resim.url}</td>
                </tr>
            `;
        });
        $("#resimListesi").html(html);
        
        // Yedek olarak LocalStorage'a da kaydet
        localStorage.setItem('sliderResimleri', JSON.stringify(resimler));
    }

    // Sıra değiştirme fonksiyonu
    window.sirayiDegistir = function(id, direction) {
        const currentIndex = resimler.findIndex(r => r._id === id);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= resimler.length) return;

        // Yeni sıra numarasını belirle
        const newOrder = resimler[newIndex].order;

        // API'ye gönder
        $.ajax({
            url: `${API_URL}/images/${id}/order`,
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            contentType: 'application/json',
            data: JSON.stringify({ order: newOrder }),
            success: function(response) {
                if (response.images) {
                    resimler = response.images;
                    resimleriListele();
                } else {
                    resimleriGetir(); // Yedek çözüm
                }
            },
            error: function(err) {
                console.error('Sıra değiştirme hatası:', err);
                alert('Sıra değiştirme işlemi başarısız oldu.');
            }
        });
    };

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
});