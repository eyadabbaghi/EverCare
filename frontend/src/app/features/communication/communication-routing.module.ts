import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatComponent } from './pages/chat/chat.component'; // Importation du composant

const routes: Routes = [
  {
    path: '',
    component: ChatComponent // On définit ChatComponent comme page par défaut du module
 }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CommunicationRoutingModule { }
