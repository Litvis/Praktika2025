import { createRouter, createWebHistory } from 'vue-router';

// Import your components
import EmailList from '~/components/adminlanding/emailList.vue';
import EmailDetail from '~/components/adminlanding/emailDetail.vue';

const routes = [
  {
    path: '/emails',
    name: 'EmailList',
    component: EmailList
  },
  {
    path: '/emails/:id',
    name: 'EmailDetailView',
    component: () => import('~/components/adminlanding/emailDetailView.vue'),
    props: true
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;