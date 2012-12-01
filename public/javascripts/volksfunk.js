$(function () {
    var viewModel = {
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
                        console.log(response);
                    }
                });
            }
        }
    };
    ko.applyBindings(viewModel);
});