'use strict';

mica.study
  .factory('StudyStatesResource', ['$resource',
    function ($resource) {
      return $resource('ws/draft/study-states');
    }])

  .factory('StudyStateResource', ['$resource',
    function ($resource) {
      return $resource('ws/draft/study-state/:id', {}, {
        'get': {method: 'GET'}
      });
    }])

  .factory('DraftStudiesResource', ['$resource',
    function ($resource) {
      return $resource('ws/draft/studies?comment:comment', {}, {
        'save': {method: 'POST', errorHandler: true}
      });
    }])

  .factory('DraftStudyResource', ['$resource',
    function ($resource) {
      return $resource('ws/draft/study/:id', {}, {
        // override $resource.save method because it uses POST by default
        'save': {method: 'PUT', params: {id: '@id'}, errorHandler: true},
        'delete': {method: 'DELETE', params: {id: '@id'}, errorHandler: true},
        'get': {method: 'GET'}
      });
    }])

  .factory('DraftStudyPublicationResource', ['$resource',
    function ($resource) {
      return $resource('ws/draft/study/:id/_publish', {}, {
        'publish': {method: 'PUT', params: {id: '@id'}},
        'unPublish': {method: 'DELETE', params: {id: '@id'}}
      });
    }])

  .factory('DraftStudyRevisionsResource', ['$resource',
    function ($resource) {
      return $resource('ws/draft/study/:id/commits', {}, {
        'get': {method: 'GET', params: {id: '@id'}}
      });
    }])

  .factory('DraftStudyRestoreRevisionResource', ['$resource',
    function ($resource) {
      return $resource('ws/draft/study/:id/commit/:commitId/restore', {}, {
        'restore': {method: 'PUT', params: {id: '@id', commitId: '@commitId'}}
      });
    }])

  .factory('DraftStudyViewRevisionResource', ['$resource',
    function ($resource) {
      return $resource('ws/draft/study/:id/commit/:commitId/view', {}, {
        'view': {method: 'GET', params: {id: '@id', commitId: '@commitId'}}
      });
    }])

  .factory('MicaStudiesConfigResource', ['$resource',
    function ($resource) {
      return $resource('ws/config/studies', {}, {
        'get': {method: 'GET'}
      });
    }])

  .factory('DraftStudiesSummariesResource', ['$resource',
    function ($resource) {
      return $resource('ws/draft/studies/summaries?', {}, {
        'summaries': {method: 'GET', isArray: true, params: {id: '@id'}}
      });
    }]);
