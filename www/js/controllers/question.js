function add(a, v) {
  if (a.indexOf(v) < 0) a.push(v);
}

function remove(a, v) {
  var i = a.indexOf(v);
  if (i >= 0) a.splice(i, 1);
}

function has(a, v) {
  return a.indexOf(v) >= 0;
}

function isSame(a1, a2) {
  return _.difference(a1, a2).length === 0 &&
         _.difference(a2, a1).length === 0;
}

var LOADING = '<ion-spinner class="spinner-positive" icon="bubbles">' +
              '</ion-spinner><br/>Preparing questions...';

angular.module('Controllers')
.controller('QuestionController', function($scope, $rootScope, $ionicLoading,
      $cordovaInAppBrowser, DB, Stat) {

  $rootScope.$on('$stateChangeSuccess',
    function(event, toState, toParams, fromState, fromParams) {
      if (toState.name === 'tabs.question' && !$scope.question)
        $scope.selectQuestion();
    });

  $scope.selectQuestion = function(filter) {
    $scope.updating = true;
    $ionicLoading.show({template: LOADING});

    var q = $scope.question;
    if (q && !isSame(q.tags, $scope.oldTags)) {
      q.status = has(q.tags, 'Resolved') ? 1 : 0;
      DB.updateQuestion(q)
        .then(function(e) {
          if (e) {
            console.log('Failed to update question because ' + e.stack);
            alert('Failed to update question because ' + e);
          }
          Stat.questions.dirty = true;
          $scope.question = null;
          $scope.selectQuestion();
        });
      return;
    }

    DB.selectQuestion(filter || Stat.filter)
      .then(function(question) {
        if (!question) {
          $scope.question = null;
          console.log('No question found', JSON.stringify(Stat.filter));
        } else {
          $scope.oldTags = _.clone(question.tags);
          $scope.newTags = _.difference(_.clone(Stat.tags), question.tags);

          $scope.question = question;
          $scope.idx = DB.idx + 1;
          $scope.count = DB.keys.length;
        }

        $ionicLoading.hide();
        $scope.updating = false;
      });
  };

  $scope.addTag = function(tag) {
    add($scope.question.tags, tag);
    remove($scope.newTags, tag);
  };

  $scope.removeTag = function(tag) {
    add($scope.newTags, tag);
    remove($scope.question.tags, tag);
  };

  $scope.open = function(url) {
    var opts = {
      location: 'yes',
      toolbar: 'yes'
    };
    $cordovaInAppBrowser.open(url, '_blank', opts);
  };

  $scope.updating = false;
  $scope.tagging = false;

  $scope.question = null;
  $scope.idx = 0;
  $scope.count = 0;

  if (!$scope.question)
    $scope.selectQuestion();
});
