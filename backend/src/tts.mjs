const options = {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: '{"model_id":"<string>","pronunciation_dictionary_locators":[{"pronunciation_dictionary_id":"<string>","version_id":"<string>"}],"text":"<string>","voice_settings":{"similarity_boost":123,"stability":123,"style":123,"use_speaker_boost":true}}'
  };
  
  fetch('https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?optimize_streaming_latency=-1', options)
    .then(response => response.json())
    .then(response => console.log(response))
    .catch(err => console.error(err));