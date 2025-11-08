const rawSecret = 'YOUR_RAW_JWT_SECRET_HERE'; // PASTE YOUR RAW JWT SECRET HERE
            const encoder = new TextEncoder();
            const encoded = btoa(String.fromCharCode(...encoder.encode(rawSecret)))
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=+$/, '');
            console.log('Your Base64url Encoded JWT Secret:', encoded);