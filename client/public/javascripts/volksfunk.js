$(function () {
    window.volksfunk = {}; //Global place to put stuff
    var viewModel = window.volksfunk.viewModel = {
        page: ko.observable('login'),
        secret: ko.observable($.cookie('volksfunk_secret')),
        genre: ko.observable(),
        login: {
            email: ko.observable(),
            password: ko.observable(),
            send: function () {
                $.ajax('/client/auth',{
                    type: 'POST',
                    data: {
                        email: viewModel.login.email(),
                        password: viewModel.login.password()
                    },
                    success: function(response) {
                        if (response.secret) {
                            viewModel.secret(response.secret);
                            viewModel.page('genre');
                        }
                    }
                });
            }
        }
    };

    // When the secret is set in the viewModel, save it in a cookie
    ko.computed(function () {
        var secret = viewModel.secret(),
            cookie = $.cookie('volksfunk_secret');
        if (secret && (secret !== cookie)) {
            $.cookie('volksfunk_secret', secret, { expires: 30, path: '/' });
        }
    }, viewModel);

    // Set the current page based on the secret and genre
    ko.computed(function () {
        var secret = viewModel.secret(),
            genre = viewModel.genre();
        if (secret && genre) {
            viewModel.page('radio');
            return;
        }
        if (secret) {
            viewModel.page('genre');
            return;
        }
        viewModel.page('login');
    }, viewModel);

    var genres = [
            'Blues',
            'Classical',
            'Country',
            'Electronic',
            'Experimental',
            'Folk',
            'Hip-Hop',
            'International',
            'Jazz',
            'Novelty',
            'Old-Time',
            'Pop',
            'Rock',
            'Soul-RnB',
            'Spoken'
        ],
        $genreList = $('#genreList');
    $.each(genres, function (index, genreName) {
        $genreList.append(
            $('<span>').text(genreName).click(function () {
                viewModel.genre(genreName);
            })
        );
    });

    ko.applyBindings(viewModel);
});