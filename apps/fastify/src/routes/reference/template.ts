const CSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
    #scalar-container { height: 100vh; width: 100vw; }
    .login-button {
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px;
      cursor: pointer; font-size: 14px; font-weight: 500; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      transition: all 0.2s;
    }
    .login-button:hover { background: #5568d3; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .login-button:disabled { background: #ccc; cursor: not-allowed; }
    .modal-overlay {
      display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 20000; align-items: center; justify-content: center;
    }
    .modal-overlay.show { display: flex; }
    .modal {
      background: white; border-radius: 12px; padding: 32px; max-width: 400px; width: 90%;
      max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .modal-title { font-size: 24px; font-weight: 600; color: #333; }
    .close-button {
      background: none; border: none; font-size: 24px; cursor: pointer; color: #666;
      padding: 0; width: 32px; height: 32px; display: flex; align-items: center;
      justify-content: center; border-radius: 4px;
    }
    .close-button:hover { background: #f5f5f5; }
    .form-group { margin-bottom: 20px; }
    .form-label { display: block; margin-bottom: 8px; font-weight: 500; color: #333; font-size: 14px; }
    .form-input {
      width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px;
      font-size: 14px; transition: border-color 0.2s;
    }
    .form-input:focus { outline: none; border-color: #667eea; }
    .form-error { color: #dc2626; font-size: 12px; margin-top: 4px; }
    .form-success { color: #16a34a; font-size: 12px; margin-top: 4px; }
    .submit-button {
      width: 100%; padding: 12px; background: #667eea; color: white; border: none;
      border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.2s;
    }
    .submit-button:hover:not(:disabled) { background: #5568d3; }
    .submit-button:disabled { background: #ccc; cursor: not-allowed; }
`

function getScript(apiUrl: string, openApiUrl: string, callbackUrl: string): string {
  return `const apiUrl='${apiUrl}';const callbackUrl='${callbackUrl}';const openApiUrl='${openApiUrl}';let scalarApiReference=null;scalarApiReference=Scalar.createApiReference({spec:{url:openApiUrl},authentication:{preferredSecurityScheme:'Bearer',apiKey:{token:(()=>{const token=localStorage.getItem('scalar-token');return token?'Bearer '+token:'';})()}}});scalarApiReference.mount('#scalar-container');const loginButton=document.getElementById('login-button');const modalOverlay=document.getElementById('modal-overlay');const closeModal=document.getElementById('close-modal');const loginForm=document.getElementById('login-form');const emailInput=document.getElementById('email');const emailError=document.getElementById('email-error');const emailSuccess=document.getElementById('email-success');const submitButton=document.getElementById('submit-button');function showModal(){modalOverlay.classList.add('show');}function hideModal(){modalOverlay.classList.remove('show');emailInput.value='';emailError.textContent='';emailSuccess.textContent='';}loginButton.addEventListener('click',showModal);closeModal.addEventListener('click',hideModal);modalOverlay.addEventListener('click',(e)=>{if(e.target===modalOverlay)hideModal();});const token=localStorage.getItem('scalar-token');if(token){loginButton.textContent='Logout';loginButton.onclick=()=>{localStorage.removeItem('scalar-token');location.reload();};}loginForm.addEventListener('submit',async(e)=>{e.preventDefault();const email=emailInput.value.trim();emailError.textContent='';emailSuccess.textContent='';submitButton.disabled=true;submitButton.textContent='Sending...';try{const response=await fetch(apiUrl+'/auth/magiclink/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,callbackUrl})});const data=await response.json();if(!response.ok)throw new Error(data.message||'Failed to send magic link');emailSuccess.textContent='Check your email for the magic link';submitButton.textContent='Magic link sent';}catch(error){emailError.textContent=error.message||'Failed to send magic link. Please try again.';submitButton.textContent='Send magic link';}finally{submitButton.disabled=false;}});window.addEventListener('message',(event)=>{if(event.origin!==window.location.origin)return;if(event.data.type==='SCALAR_AUTH_TOKEN'){const token=event.data.token;localStorage.setItem('scalar-token',token);if(scalarApiReference&&scalarApiReference.updateAuthentication){scalarApiReference.updateAuthentication({preferredSecurityScheme:'Bearer',apiKey:{token:'Bearer '+token}});}else{location.reload();}loginButton.textContent='Logout';loginButton.onclick=()=>{localStorage.removeItem('scalar-token');location.reload();};hideModal();}});`
}

export function getReferenceHtml(apiUrl: string, openApiUrl: string, callbackUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Reference - Basilic</title>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest/dist/browser/standalone.js"></script>
  <style>${CSS}
  </style>
</head>
<body>
  <button id="login-button" class="login-button">Login</button>
  <div id="scalar-container"></div>
  <div id="modal-overlay" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Login</h2>
        <button id="close-modal" class="close-button">&times;</button>
      </div>
      <form id="login-form">
        <div class="form-group">
          <label class="form-label" for="email">Email</label>
          <input type="email" id="email" class="form-input" placeholder="m@example.com" required />
          <div id="email-error" class="form-error"></div>
          <div id="email-success" class="form-success"></div>
        </div>
        <button type="submit" id="submit-button" class="submit-button">Send magic link</button>
      </form>
    </div>
  </div>
  <script>${getScript(apiUrl, openApiUrl, callbackUrl)}</script>
</body>
</html>`
}
