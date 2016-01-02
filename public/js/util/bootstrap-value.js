// dependency injection for data rendered on html pages in <script> tags
angular.module('utilBootstrap', [])
.value('_q', window._q)
.value('_g', window._g);
