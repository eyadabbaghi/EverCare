import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-journal',
  templateUrl: './journal.component.html',
  styleUrls: ['./journal.component.css']
})
export class JournalComponent implements OnInit {

  journalText: string = '';
  
  entries: { date: string; text: string }[] = [];

  recognition: any;
  isListening = false;
  

  ngOnInit(): void {
  // Load entries
  const saved = localStorage.getItem('journal_entries');
  this.entries = saved ? JSON.parse(saved) : [];

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  console.log('SpeechRecognition:', SpeechRecognition);

  if (!SpeechRecognition) {
    alert('Speech recognition is not supported in this browser. Use Chrome or Edge.');
    return;
  }

  this.recognition = new SpeechRecognition();
  this.recognition.lang = 'en-US'; // change to 'fr-FR' if needed
  this.recognition.continuous = true;
  this.recognition.interimResults = true;

  this.recognition.onstart = () => {
    console.log('🎙️ recognition started');
  };

  this.recognition.onend = () => {
    console.log('🛑 recognition ended');
    this.isListening = false;
  };

  this.recognition.onerror = (event: any) => {
    console.error('❌ Speech recognition error:', event);
    alert('Speech error: ' + (event.error || 'unknown'));
    this.isListening = false;
  };

  this.recognition.onresult = (event: any) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    console.log('✅ transcript:', transcript);
    this.journalText = transcript;
  };
}

async startListening() {
  console.log('Start voice clicked');

  // Ask mic permission explicitly (helps on some browsers)
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    console.error('Mic permission denied', e);
    alert('Microphone permission denied. Please allow microphone access.');
    return;
  }

  if (!this.recognition) {
    alert('Speech recognition not initialized.');
    return;
  }

  try {
    this.recognition.start();
    this.isListening = true;
  } catch (e) {
    console.error('Start error:', e);
  }
}

stopListening() {
  console.log('Stop clicked');
  if (this.recognition) {
    this.recognition.stop();
    this.isListening = false;
  }
}
saveEntry() {
    if (!this.journalText.trim()) return;

    this.entries.unshift({
      date: new Date().toISOString().slice(0, 10),
      text: this.journalText.trim()
    });

    localStorage.setItem('journal_entries', JSON.stringify(this.entries));
    this.journalText = '';
  }

  deleteEntry(index: number) {
    this.entries.splice(index, 1);
    localStorage.setItem('journal_entries', JSON.stringify(this.entries));
  }
}