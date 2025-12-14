// config/brevoEmail.js
import SibApiV3Sdk from 'sib-api-v3-sdk';

// Brevo API konfiqurasiyası
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY; // .env faylınıza əlavə edin

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Signup email göndərmə
export const sendSignupEmail = async (userEmail, userName) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = "Xoş gəldiniz - Qeydiyyatınız uğurla tamamlandı!";
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🐾 PetHub-a Xoş Gəldiniz!</h1>
        </div>
        <div class="content">
          <h2>Əziz ${userName},</h2>
          <p>Qeydiyyatınız uğurla tamamlandı!</p>
          <p>İndi platformamızdan tam şəkildə istifadə edə bilərsiniz.</p>
          <p>Hər hansı sualınız olarsa, bizimlə əlaqə saxlaya bilərsiniz.</p>
          <p><strong>Xoş vaxt keçirməyinizi arzulayırıq!</strong></p>
        </div>
        <div class="footer">
          <p>© 2024 PetHub. Bütün hüquqlar qorunur.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  sendSmtpEmail.sender = { name: "PetHub", email: "pethubaz@gmail.com" };
  sendSmtpEmail.to = [{ email: userEmail, name: userName }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Signup email göndərildi:', userEmail);
    return { success: true };
  } catch (error) {
    console.error('Email göndərmə xətası:', error);
    return { success: false, error: error.message };
  }
};

// Login email göndərmə (ilk login)
export const sendLoginEmail = async (userEmail, userName) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = "Yeni Giriş Bildirişi";
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Giriş Bildirişi</h1>
        </div>
        <div class="content">
          <h2>Əziz ${userName},</h2>
          <p>Hesabınıza yeni giriş edildi.</p>
          <p><strong>Tarix:</strong> ${new Date().toLocaleString('az-AZ')}</p>
          <p>Bu siz deyilsinizsə, dərhal şifrənizi dəyişdirin.</p>
        </div>
        <div class="footer">
          <p>© 2024 PetHub. Bütün hüquqlar qorunur.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  sendSmtpEmail.sender = { name: "PetHub", email: "pethubaz@gmail.com" };
  sendSmtpEmail.to = [{ email: userEmail, name: userName }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Login email göndərildi:', userEmail);
    return { success: true };
  } catch (error) {
    console.error('Email göndərmə xətası:', error);
    return { success: false, error: error.message };
  }
};

// Şifrə sıfırlama email göndərmə
export const sendResetPasswordEmail = async (userEmail, userName, resetToken) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = "Şifrə Sıfırlama Kodu";
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF5722; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .code { background-color: #fff; border: 2px dashed #FF5722; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #FF5722; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔑 Şifrə Sıfırlama</h1>
        </div>
        <div class="content">
          <h2>Əziz ${userName},</h2>
          <p>Şifrənizi sıfırlamaq üçün aşağıdakı kodu istifadə edin:</p>
          <div class="code">${resetToken}</div>
          <p><strong>Diqqət:</strong> Bu kod 10 dəqiqə ərzində etibarlıdır.</p>
          <p>Əgər bu sorğunu siz göndərməmisinizsə, bu emaili nəzərə almayın.</p>
        </div>
        <div class="footer">
          <p>© 2024 PetHub. Bütün hüquqlar qorunur.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  sendSmtpEmail.sender = { name: "PetHub", email: "pethubaz@gmail.com" };
  sendSmtpEmail.to = [{ email: userEmail, name: userName }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Reset password email göndərildi:', userEmail);
    return { success: true };
  } catch (error) {
    console.error('Email göndərmə xətası:', error);
    return { success: false, error: error.message };
  }
};

// Şifrə uğurla dəyişdirildi email
export const sendPasswordChangedEmail = async (userEmail, userName) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.subject = "Şifrəniz Uğurla Dəyişdirildi";
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Şifrə Dəyişdirildi</h1>
        </div>
        <div class="content">
          <h2>Əziz ${userName},</h2>
          <p>Şifrəniz uğurla dəyişdirildi.</p>
          <p><strong>Tarix:</strong> ${new Date().toLocaleString('az-AZ')}</p>
          <p>İndi yeni şifrənizlə daxil ola bilərsiniz.</p>
          <p>Bu siz deyilsinizsə, dərhal bizimlə əlaqə saxlayın.</p>
        </div>
        <div class="footer">
          <p>© 2024 PetHub. Bütün hüquqlar qorunur.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  sendSmtpEmail.sender = { name: "PetHub", email: "pethubaz@gmail.com" };
  sendSmtpEmail.to = [{ email: userEmail, name: userName }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Password changed email göndərildi:', userEmail);
    return { success: true };
  } catch (error) {
    console.error('Email göndərmə xətası:', error);
    return { success: false, error: error.message };
  }
};