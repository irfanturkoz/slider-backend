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
        console.log('Resimler getiriliyor...');
        $.ajax({
            url: `${API_URL}/images`,
            method: 'GET',
            success: function(data) {
                console.log('Resimler başarıyla alındı:', data);
                resimler = data;
                
                // LocalStorage'a kaydet
                localStorage.setItem('sliderResimleri', JSON.stringify(resimler));
                
                // Resimleri listele
                resimleriListele();
            },
            error: function(err) {
                console.error('Resimler yüklenirken hata oluştu:', err);
                if (err.status === 401) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUsername');
                    window.location.href = 'login.html';
                    return;
                }
                
                // LocalStorage'dan resimleri yüklemeyi dene
                const cachedImages = localStorage.getItem('sliderResimleri');
                if (cachedImages) {
                    console.log('Resimler LocalStorage\'dan yükleniyor...');
                    resimler = JSON.parse(cachedImages);
                    resimleriListele();
                } else {
                    alert('Resimler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
                }
            }
        });
    }

    // Resimleri listele
    function resimleriListele() {
        console.log('Listelenecek resimler:', resimler); // Debug için log
        
        const resimListesi = document.getElementById('resimListesi');
        resimListesi.innerHTML = '';
        
        resimler.forEach((resim, index) => {
            const resimItem = document.createElement('div');
            resimItem.className = 'resim-item mb-3 p-3 border rounded';
            resimItem.setAttribute('data-id', resim._id);
            
            // Resim URL'sini kullan - backend tarafından tam URL döndürülüyor
            const resimUrl = resim.url;
            console.log(`Resim ${index + 1} URL:`, resimUrl); // Debug için log
            
            resimItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${resimUrl}" alt="Resim" style="max-width: 200px; max-height: 150px; object-fit: cover;" class="mr-3">
                    <div>
                        <p class="mb-1">Sıra: ${resim.order}</p>
                        <p class="mb-1">URL: ${resim.url}</p>
                        <button class="btn btn-danger btn-sm" onclick="resmiSil('${resim._id}')">
                            <i class="fas fa-trash"></i> Sil
                        </button>
                    </div>
                </div>
            `;
            
            resimListesi.appendChild(resimItem);
        });
        
        // Sortable özelliğini aktifleştir
        if (resimler.length > 1) {
            $("#resimListesi").sortable({
                update: function(event, ui) {
                    const yeniSiralama = [];
                    $("#resimListesi .resim-item").each(function(index) {
                        yeniSiralama.push({
                            id: $(this).data('id'),
                            order: index + 1
                        });
                    });
                    sirayiDegistir(yeniSiralama);
                }
            });
        }
    }

    // Yeni sıralamayı kaydet
    function sirayiDegistir(yeniSiralama) {
        $.ajax({
            url: `${API_URL}/images/reorder`,
            type: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({ orders: yeniSiralama }),
            success: function(response) {
                console.log('Sıralama başarılı:', response);
                if (response.images) {
                    resimler = response.images;
                    resimleriListele();
                    localStorage.setItem('sliderResimleri', JSON.stringify(resimler));
                }
            },
            error: function(xhr, status, error) {
                console.error('Sıralama hatası:', { xhr, status, error });
                alert('Sıralama kaydedilirken bir hata oluştu. Sayfa yenileniyor...');
                location.reload();
            }
        });
    }

    // Resim ekleme formunu yakala
    document.getElementById('resimForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        const imageFile = document.getElementById('imageFile').files[0];
        const imageUrl = document.getElementById('imageUrl').value.trim();
        
        if (!imageFile && !imageUrl) {
            alert('Lütfen bir resim dosyası yükleyin veya URL girin');
            return;
        }
        
        // Yükleme başladı mesajı
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yükleniyor...';
        
        try {
            let response;
            
            if (imageFile) {
                // Dosya yükleme - kullanıcıya uyarı göster
                if (!confirm('UYARI: Dosya yüklemeleri Render.com\'da kalıcı değildir. Her yeni dağıtımda (deploy) yüklenen dosyalar kaybolacaktır. Devam etmek istiyor musunuz? (Bunun yerine URL kullanmanızı öneririz)')) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    return;
                }
                
                console.log('Dosya yükleniyor:', imageFile.name);
                
                // Dosya yükleme
                formData.append('image', imageFile);
                response = await fetch(`${API_URL}/images`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
            } else {
                console.log('URL ekleniyor:', imageUrl);
                
                // URL ile ekleme
                response = await fetch(`${API_URL}/images`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ url: imageUrl })
                });
            }

            const data = await response.json();
            console.log('API yanıtı:', data);
            
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Resim eklenirken bir hata oluştu');
            }

            // Eğer uyarı mesajı varsa göster
            if (data.message.includes('geçici')) {
                alert(data.message);
            } else {
                alert('Resim başarıyla eklendi');
            }
            
            // Formu temizle
            document.getElementById('resimForm').reset();
            
            // Resimleri yeniden listele
            if (data.images && data.images.length > 0) {
                console.log('Yeni resim listesi alındı:', data.images);
                resimler = data.images;
                resimleriListele();
                
                // LocalStorage'a kaydet
                localStorage.setItem('sliderResimleri', JSON.stringify(resimler));
            } else {
                console.log('Resimler yeniden getiriliyor...');
                resimleriGetir();
            }
        } catch (error) {
            console.error('Hata:', error);
            alert('Resim eklenirken bir hata oluştu: ' + error.message);
        } finally {
            // Buton durumunu geri al
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });

    // Resim silme fonksiyonu
    function resmiSil(id) {
        if (confirm('Bu resmi silmek istediğinizden emin misiniz?')) {
            $.ajax({
                url: `${API_URL}/images/${id}`,
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                success: function(response) {
                    alert('Resim başarıyla silindi');
                    resimleriGetir();
                },
                error: function(err) {
                    console.error('Resim silinirken hata oluştu:', err);
                    if (err.status === 401) {
                        localStorage.removeItem('adminToken');
                        localStorage.removeItem('adminUsername');
                        window.location.href = 'login.html';
                        return;
                    }
                    alert('Resim silinirken bir hata oluştu');
                }
            });
        }
    }

    // Global scope'a ekle
    window.resmiSil = resmiSil;
});