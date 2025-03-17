export class VerificationEmailTemplate {
  static generate(userName: string, verificationUrl: string): string {
    return `
    <!DOCTYPE html>
    <html lang="uk">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Верифікація акаунту</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f8f8f8;
          margin: 0;
          padding: 0;
          text-align: center;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
        }
        .logo {
          width: 120px;
          margin-bottom: 20px;
        }
        h1 {
          color: #333;
          font-size: 22px;
        }
        p {
          font-size: 16px;
          color: #666;
          line-height: 1.6;
        }
        .btn {
          display: inline-block;
          background-color: #e53935;
          cursor: pointer;
          color: #fff;
          padding: 12px 24px;
          font-size: 18px;
          font-weight: bold;
          border-radius: 5px;
          text-decoration: none;
          margin-top: 20px;
        }
        .btn:hover {
          background-color: #d32f2f;
        }
        .footer {
          font-size: 14px;
          color: #999;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <img src="https://your-website.com/logo.png" alt="Bookme" class="logo">
        <h1>Привіт, ${userName}!</h1>
        <p>Дякуємо за реєстрацію в <strong>Bookme</strong>! Щоб завершити реєстрацію, будь ласка, підтвердіть свою електронну адресу.</p>
        <a href="${verificationUrl}" class="btn">Активувати акаунт</a>
        <p class="footer">Якщо ви не реєструвалися, просто ігноруйте цей лист.</p>
      </div>
    </body>
    </html>
    `;
  }
}
