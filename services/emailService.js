// services/emailService.js
import SibApiV3Sdk from 'sib-api-v3-sdk';
import dotenv from 'dotenv';
// Export et
export { initializeBrevoClient };

// Və bu funksiyanı əlavə et

dotenv.config();
export const checkBrevoApiKey = () => {
  const apiKey = process.env.BREVO_API_KEY;
  console.log('🔍 API Key check:');
  console.log('- Mövcuddur:', !!apiKey);
  console.log('- Uzunluğu:', apiKey?.length);
  console.log('- İlk 20 simvol:', apiKey?.substring(0, 20) + '...');
  return !!apiKey;
};
// Brevo API konfiqurasiyası
// ✅ YENİ (düzgün)
let apiInstance;

const initializeBrevoClient = () => {
  try {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    console.log('✅ Brevo API client initialized');
    return true;
  } catch (error) {
    console.error('❌ Brevo API initialization failed:', error.message);
    return false;
  }
};

// Initialize immediately
initializeBrevoClient();
// 6 rəqəmli təsadüfi kod yaratmaq
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Brevo ilə email göndərmə funksiyası - retry logic ilə
// ✅ YENİ
const sendEmailWithRetry = async (emailData, retries = 3) => {
  // API client yoxla və lazım gələrsə yenidən initialize et
  if (!apiInstance) {
    console.log('⚠️ API instance tapılmadı, yenidən initialize edilir...');
    initializeBrevoClient();
  }

  for (let i = 0; i < retries; i++) {
    try {
      const result = await apiInstance.sendTransacEmail(emailData);
      console.log(`✅ Email göndərildi (cəhd ${i + 1}): ${emailData.to[0].email} - Message ID: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.log(`❌ Email xətası (cəhd ${i + 1}):`, error.message);
      
      if (i === retries - 1) {
        console.error('Bütün email göndərmə cəhdləri uğursuz:', error.message);
        return { success: false, error: error.message };
      }
      
      // Növbəti cəhd üçün gözlə (3, 6, 9 saniyə)
      await new Promise(resolve => setTimeout(resolve, 3000 * (i + 1)));
    }
  }
  return { success: false, error: 'Bütün cəhdlər uğursuz oldu' };
};

// Verification email göndərmək
export const sendVerificationEmail = async (userEmail, userName, userSurname, verificationCode) => {
  const emailData = {
   sender: {
  name: "PetHub Platform",
  email: "pethubaz@gmail.com"  // .env-də olan EMAIL_USER
},
    to: [
      {
        email: userEmail,
        name: `${userName} ${userSurname}`
      }
    ],
    subject: ' Email Təsdiqi - PetHub',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 50%; display: inline-block; margin-bottom: 20px;">
            </div>
            <h1 style="color: #333; margin: 0; font-size: 28px;">PetHub</h1>
            <h2 style="color: #667eea; margin: 10px 0 0 0; font-size: 22px;">Email Təsdiqi</h2>
          </div>
          
          <!-- Greeting -->
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Salam <strong>${userName} ${userSurname}</strong>,
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            PetHub platformasına xoş gəlmisiniz!  Qeydiyyatınızı tamamlamaq üçün aşağıdakı 6 rəqəmli təsdiq kodunu daxil edin:
          </p>
          
          <!-- Verification Code -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
            <h1 style="color: white; font-size: 42px; letter-spacing: 10px; margin: 0; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">
              ${verificationCode}
            </h1>
          </div>
          
          <!-- Time Warning -->
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #2196F3;">
            <p style="color: #1565c0; margin: 0; font-size: 15px;">
               Bu təsdiq kodu <strong>10 dəqiqə</strong> müddətində etibarlıdır.
            </p>
          </div>
          
          <!-- Security Notice -->
          <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 18px; border-radius: 10px; margin: 25px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
               <strong>Təhlükəsizlik qeydi:</strong> Əgər bu qeydiyyat sizin tərəfinizdən edilməyibsə, bu email-i nəzərə almayın.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding-top: 25px; border-top: 2px solid #eee;">
            <p style="color: #888; font-size: 14px; margin: 5px 0;">
              Bu email avtomatik göndərilmişdir. Cavab verməyin.
            </p>
            <p style="color: #888; font-size: 13px; margin: 15px 0 0 0;">
              © 2025 PetHub. Bütün hüquqlar qorunur.
            </p>
          </div>
        </div>
      </div>
    `,
    textContent: `
      Salam ${userName} ${userSurname},
      
      PetHub platformasına xoş gəlmisiniz! Qeydiyyatınızı tamamlamaq üçün aşağıdakı təsdiq kodunu daxil edin:
      
      Təsdiq kodu: ${verificationCode}
      
      Bu kod 10 dəqiqə müddətində etibarlıdır.
      
      Əgər bu qeydiyyat sizin tərəfinizdən edilməyibsə, bu email-i nəzərə almayın.
      
      © 2025 PetHub
    `
  };

  const result = await sendEmailWithRetry(emailData);
  return result.success;
};

// Welcome email göndərmək
export const sendWelcomeEmail = async (userEmail, userName, userSurname) => {
  const emailData = {
   sender: {
  name: "PetHub Platform",
  email: "pethubaz@gmail.com"  // .env-də olan EMAIL_USER
},
    to: [
      {
        email: userEmail,
        name: `${userName} ${userSurname}`
      }
    ],
    subject: ' Xoş gəlmisiniz - PetHub',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          
          <!-- Header with Success Icon -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 25px; border-radius: 50%; display: inline-block; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
              <span style="color: white; font-size: 40px;">✅</span>
            </div>
            <h1 style="color: #4CAF50; margin: 0; font-size: 32px; font-weight: bold;">Təbriklər!</h1>
            <h2 style="color: #333; margin: 15px 0 0 0; font-size: 20px;">Hesabınız uğurla yaradıldı</h2>
          </div>
          
          <!-- Greeting -->
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            Əziz <strong>${userName} ${userSurname}</strong>,
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
             PetHub platformasına xoş gəlmisiniz! Email təsdiqi uğurla tamamlandı və hesabınız aktivləşdirildi.
          </p>
          
          <!-- Account Info Box -->
          <div style="background: linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%); padding: 30px; border-radius: 12px; margin: 30px 0; border-left: 5px solid #4CAF50;">
            <h3 style="color: #2e7d32; margin-top: 0; margin-bottom: 20px; font-size: 18px;">
              ✅ Hesab məlumatlarınız
            </h3>
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <p style="margin: 8px 0; color: #333; font-size: 15px;">
                <strong> Ad Soyad:</strong> ${userName} ${userSurname}
              </p>
              <p style="margin: 8px 0; color: #333; font-size: 15px;">
                <strong>Email:</strong> ${userEmail}
              </p>
              <p style="margin: 8px 0; color: #4CAF50; font-size: 15px; font-weight: bold;">
                <strong>Status:</strong> Təsdiqlənmiş ✓
              </p>
            </div>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <p style="color: #555; margin-bottom: 20px; font-size: 16px;">Platformamıza daxil olmaq üçün:</p>
            <a href="https://PetHub.az/login" style="display: inline-block; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3); transition: all 0.3s;">
               İndi Giriş Et
            </a>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding-top: 25px; border-top: 2px solid #eee;">
            <p style="color: #555; font-size: 14px; margin-bottom: 10px;">
              Sualınız var? Bizə yazın:
            </p>
            <p style="color: #667eea; font-weight: bold; font-size: 15px; margin: 5px 0;">
pethubaz@gmail.com            </p>
            <p style="color: #888; font-size: 13px; margin: 20px 0 0 0;">
              © 2025 PetHub. Bütün hüquqlar qorunur.
            </p>
          </div>
        </div>
      </div>
    `,
    textContent: `
      Təbriklər ${userName} ${userSurname}!
      
      PetHub platformasına xoş gəlmisiniz! Email təsdiqi uğurla tamamlandı və hesabınız aktivləşdirildi.
      
      Hesab məlumatlarınız:
      - Ad Soyad: ${userName} ${userSurname}
      - Email: ${userEmail}
      - Status: Təsdiqlənmiş
      
      İndi platformamıza daxil ola bilərsiniz: https://PetHub.az/login
      
      Sualınız var? Bizə yazın: pethubaz@gmail.com
      
      © 2025 PetHub
    `
  };

  const result = await sendEmailWithRetry(emailData);
  return result.success;
};

// Password Reset Email göndərmək
export const sendPasswordResetEmail = async (userEmail, userName, userSurname, resetCode) => {
  const emailData = {
   sender: {
  name: "PetHub Platform",
  email: "pethubaz@gmail.com"  // .env-də olan EMAIL_USER
},
    to: [
      {
        email: userEmail,
        name: `${userName} ${userSurname}`
      }
    ],
    subject: 'Şifrə Sıfırlama - PetHub',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%); padding: 25px; border-radius: 50%; display: inline-block; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);">
            </div>
            <h1 style="color: #ff6b6b; margin: 0; font-size: 28px; font-weight: bold;">Şifrə Sıfırlama</h1>
            <h2 style="color: #333; margin: 15px 0 0 0; font-size: 20px;">PetHub</h2>
          </div>
          
          <!-- Greeting -->
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            Salam <strong>${userName} ${userSurname}</strong>,
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Şifrənizi sıfırlamaq üçün sorğu göndərdiniz. Aşağıdakı 6 rəqəmli kodu istifadə edərək yeni şifrə təyin edə bilərsiniz:
          </p>
          
          <!-- Reset Code -->
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%); padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center; box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);">
            <h1 style="color: white; font-size: 42px; letter-spacing: 10px; margin: 0; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">
              ${resetCode}
            </h1>
          </div>
          
          <!-- Time Warning -->
          <div style="background-color: #fff3e0; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ff9800;">
            <p style="color: #e65100; margin: 0; font-size: 15px;">
               Bu sıfırlama kodu <strong>15 dəqiqə</strong> müddətində etibarlıdır.
            </p>
          </div>
          
          <!-- Security Warning -->
          <div style="background-color: #ffebee; border: 1px solid #ffcdd2; padding: 18px; border-radius: 10px; margin: 25px 0;">
            <p style="color: #c62828; margin: 0; font-size: 14px; line-height: 1.5;">
               <strong>Təhlükəsizlik qeydi:</strong> Əgər şifrə sıfırlama tələbi sizin tərəfinizdən edilməyibsə, bu email-i nəzərə almayın və dərhal bizə məlumat verin.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding-top: 25px; border-top: 2px solid #eee;">
            <p style="color: #555; font-size: 14px; margin-bottom: 10px;">
              Sualınız var? Bizə yazın:
            </p>
            <p style="color: #667eea; font-weight: bold; font-size: 15px; margin: 5px 0;">
pethubaz@gmail.com            </p>
            <p style="color: #888; font-size: 13px; margin: 20px 0 0 0;">
              © 2025 PetHub. Bütün hüquqlar qorunur.
            </p>
          </div>
        </div>
      </div>
    `,
    textContent: `
      Salam ${userName} ${userSurname},
      
      Şifrənizi sıfırlamaq üçün sorğu göndərdiniz. Aşağıdakı 6 rəqəmli kodu istifadə edərək yeni şifrə təyin edə bilərsiniz:
      
      Sıfırlama kodu: ${resetCode}
      
      Bu kod 15 dəqiqə müddətində etibarlıdır.
      
      Əgər şifrə sıfırlama tələbi sizin tərəfinizdən edilməyibsə, bu email-i nəzərə almayın və dərhal bizə məlumat verin.
      
      Sualınız var? Bizə yazın: pethubaz@gmail.com
      
      © 2025 PetHub
    `
  };

  const result = await sendEmailWithRetry(emailData);
  return result.success;
};

// Brevo API bağlantısını test etmək
export const testEmailConnection = async () => {
  try {
    console.log('🔄 Brevo API bağlantısı test edilir...');
    
    const testEmailData = {
      sender: {
  name: "PetHub Platform",
  email: "pethubaz@gmail.com"  // .env-də olan EMAIL_USER
},
      to: [
        {
          email: "test@example.com",
          name: "Test User"
        }
      ],
      subject: 'Test Email - Connection Check',
      htmlContent: '<html><body><h1>Test email</h1></body></html>',
      textContent: 'Test email content'
    };
    
    await apiInstance.sendTransacEmail(testEmailData);
    console.log('✅ Brevo API bağlantısı uğurludur!');
    return true;
  } catch (error) {
    if (error.response && error.response.text && error.response.text.includes('Invalid email address')) {
      console.log('✅ Brevo API bağlantısı uğurludur! (Test email rejected as expected)');
      return true;
    } else {
      console.error('❌ Brevo API bağlantı xətası:', error.message);
      return false;
    }
  }
};