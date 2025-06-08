import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ChatDashboard } from './components/chat-dashboard/chat-dashboard.component';
import { ChatGuard } from './guards/chat-guard';
import { LoginRedirectGuard } from './guards/login-guard';

export const routes: Routes = [
    { path: '', component: LoginComponent, canActivate: [LoginRedirectGuard]},
    { path: 'chat', component: ChatDashboard, canActivate: [ChatGuard]}
];
