export const emailChangePassword = (url: string, baseUrl: string) => `<mjml>
  <mj-head>
  <mj-style inline="inline">
      .link { color: #4486DD; text-decoration: none; font-weight: 600; }
    	.button-link { padding: 10px 20px; background-color: #4486DD; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; }
    .button-link:hover { background: white; }
    </mj-style>
 </mj-head>
<mj-body>
  <mj-section background-color="#152947" background-repeat="repeat" background-size="auto" padding="20px 0px 20px 0px" text-align="center">
    <mj-column>
      <mj-text align="center" color="#ffffff" font-family="Arial, sans-serif" font-size="28px" font-weight="600" line-height="28px" padding="30px 25px 0px 25px">
      Change password Yourcasino
      </mj-text>
      <mj-text align="center" color="#ffffff" font-family="Arial, sans-serif" font-size="14px" line-height="20px" padding="50px 80px 25px 80px">
       You have requested password change on Yourcasino. Next step for you is to change your password by clicking on the link bellow:
      </mj-text>
      <mj-text align="center" padding-top="20px">
        <a href="${url}" class="button-link">
          Click to change
        </a>
      </mj-text>
      <mj-text padding="40px 80px 0 80px">
        <hr />
      </mj-text>
      <mj-text align="center" color="#ffffff" font-family="Arial, sans-serif" font-size="12px" line-height="20px" padding="20px 25px 25px 25px">
       Best Regards <br /> <a href="${baseUrl}" class="link" >Yourcasino</a> Team
      </mj-text>
    </mj-column>
  </mj-section>
</mj-body>
</mjml>`;

export const emailVerification = (url: string, baseUrl: string) => `<mjml>
  <mj-head>
  <mj-style inline="inline">
      .link { color: #4486DD; text-decoration: none; font-weight: 600; }
    	.button-link { padding: 10px 20px; background-color: #4486DD; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; }
    .button-link:hover { background: white; }
    </mj-style>
 </mj-head>
<mj-body>
  <mj-section background-color="#152947" background-repeat="repeat" background-size="auto" padding="20px 0px 20px 0px" text-align="center">
    <mj-column>
      <mj-text align="center" color="#ffffff" font-family="Arial, sans-serif" font-size="28px" font-weight="600" line-height="28px" padding="30px 25px 0px 25px">
      Verify Your Email - Yourcasino
      </mj-text>
      <mj-text align="center" color="#ffffff" font-family="Arial, sans-serif" font-size="14px" line-height="20px" padding="50px 80px 25px 80px">
       Thank you for signing up with Yourcasino! To complete your registration, please verify your email address by clicking the link below:
      </mj-text>
      <mj-text align="center" padding-top="20px">
        <a href="${url}" class="button-link">
          Verify Email
        </a>
      </mj-text>
      <mj-text padding="40px 80px 0 80px">
        <hr />
      </mj-text>
      <mj-text align="center" color="#ffffff" font-family="Arial, sans-serif" font-size="12px" line-height="20px" padding="20px 25px 25px 25px">
       Best Regards <br /> <a href="${baseUrl}" class="link" >Yourcasino</a> Team
      </mj-text>
    </mj-column>
  </mj-section>
</mj-body>
</mjml>`;
