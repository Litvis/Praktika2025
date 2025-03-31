import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/emails',
    name: 'EmailList',
    component: () => import('~/components/adminlanding/emailList.vue')
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