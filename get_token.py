from google_auth_oauthlib.flow import InstalledAppFlow
import pickle

flow = InstalledAppFlow.from_client_secrets_file(
    'crawler/client_secret.json',
    ['https://www.googleapis.com/auth/youtube']
)
creds = flow.run_local_server(port=0, prompt='consent')
with open('crawler/token.pickle', 'wb') as f:
    pickle.dump(creds, f)
print('refresh_token:', creds.refresh_token)
