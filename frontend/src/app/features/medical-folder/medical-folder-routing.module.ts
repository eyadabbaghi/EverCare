import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {MedicalFolderPageComponent} from './pages/medical-folder-page/medical-folder-page.component';

const routes: Routes = [
  { path: '', component: MedicalFolderPageComponent }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MedicalFolderRoutingModule { }
