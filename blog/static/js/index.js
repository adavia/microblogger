class Paginator {
    constructor() {
        this.page = 1;
        this.emptyPage = false;
        this.blockRequest = false;
    }
    
    loadMore(container, url, e) {
        e.stopImmediatePropagation();
        const target = e.target;
        const $container = $(target).find(container);
        
        if (target.scrollTop + target.clientHeight >= target.scrollHeight &&
            this.emptyPage == false && 
            this.blockRequest == false) {
            
            this.blockRequest = true;
            this.page = this.page + 1;

            $.ajax({
                url: url + this.page,
                type: 'GET',
            }).done(response => {
                if (response == '') {
                    this.emptyPage = true;
                } else {
                    this.blockRequest = false;
                    $container.append(response);
                }
            })
            .fail((xhr, status, errorThrown) => {
                console.log(errorThrown);
            });
        }
    }
}

class User {
    constructor(el) {
        this.follow = el.find('#id_follow_user'); 
        this.followersCount = el.find('#id_followers_count');
        this.follow.on('click', this.followUser.bind(this));
    }

    followUser(e) {
        e.preventDefault();
        const $self = $(e.target);
        const url = $self.attr('href');
        const id = $self.data('id');
        const action = $self.data('action');

        const formData = new FormData;
        formData.append('id', id);
        formData.append('action', action);

        $.ajax({
            url: url, 
            type: 'POST',             
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            headers: {
                'X-CSRFToken': Cookies.get('csrftoken')
            },
        }).done(response => {
            if (response['status'] === 'ok') {
                const previousAction = $('#id_follow_user').data('action');
                $('#id_follow_user').data('action', previousAction == 'follow' ? 
                    'unfollow' : 'follow');

                $self.text(previousAction == 'follow' ? 'Unfollow' : 'Follow');
                let previousFollowers = parseInt(this.followersCount.text());
                this.followersCount.text(previousAction == 'follow' ?  
                    previousFollowers + 1 : previousFollowers - 1);
            }
        })
        .fail((xhr, status, errorThrown) => {
            console.log(errorThrown);
        });
    }
}

class Post {
    constructor(el = null) {
        const paginator = new Paginator();
        this.container = el;

        if (el) {
            el.on('click', 'span[data-target="post_delete"]', this.deletePost);
            el.on('click', 'span[data-target="post_like"]', this.likePost.bind(this));
            el.parent().on('scroll', paginator.loadMore.bind(paginator, '#id_post_container', '?page='));
        }
    }

    toggleLike(elem, action) {
        if (action === 'like') {
            elem.html(`
                <svg xmlns="http://www.w3.org/2000/svg" 
                    class="fill-current cursor-pointer text-indigo-500
                    hover:text-indigo-700 h-6 w-6" style="pointer-events: none" viewBox="0 0 24 24">
                    <path d="M12 4.248c-3.148-5.402-12-3.825-12 2.944 0 4.661 5.571 9.427 12 15.808 6.43-6.381 12-11.147 12-15.808 0-6.792-8.875-8.306-12-2.944z"/>
                </svg>
            `);
        } else {
            elem.html(`
                <svg xmlns="http://www.w3.org/2000/svg" 
                    class="fill-current cursor-pointer text-indigo-500
                    hover:text-indigo-700 h-6 w-6" style="pointer-events: none" viewBox="0 0 24 24">
                    <path d="M12 9.229c.234-1.12 1.547-6.229 5.382-6.229 2.22 0 4.618 1.551 4.618 5.003 0 3.907-3.627 8.47-10 12.629-6.373-4.159-10-8.722-10-12.629 0-3.484 2.369-5.005 4.577-5.005 3.923 0 5.145 5.126 5.423 6.231zm-12-1.226c0 4.068 3.06 9.481 12 14.997 8.94-5.516 12-10.929 12-14.997 0-7.962-9.648-9.028-12-3.737-2.338-5.262-12-4.27-12 3.737z"/>
                </svg>
            `);
        }
    }

    renderPost(data) {
        this.container.prepend(data);
    }

    deletePost(e) {
        e.stopImmediatePropagation();
        const $post = $(this).closest('article');
        const $form = $(this).closest('form');

        $.ajax({
            url: $form.attr('action'),
            type: 'DELETE',
            headers: {
                'X-CSRFToken': Cookies.get('csrftoken')
            }
        }).done(response => {
            $post.remove();
        })
        .fail((xhr, status, errorThrown) => {
            console.log(errorThrown);
        });
    }

    likePost(e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        const $self = $(e.target);
        const formData = new FormData;
        const id = $self.data('id');
        const action = $self.data('action');
        const url = $self.data('url');

        formData.append('id', id);
        formData.append('action', action);
        
        $.ajax({
            url: url, 
            type: 'POST',             
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            headers: {
                'X-CSRFToken': Cookies.get('csrftoken')
            },
        }).done(response => {
            if (response['status'] === 'ok') {
                let previousAction = $('span[data-target="post_like"]').data('action');
                $('span[data-target="post_like"]').data('action', previousAction == 'like' ? 
                    'unlike' : 'like');
            
                this.toggleLike($self, previousAction);
            }
        })
        .fail((xhr, status, errorThrown) => {
            console.log(errorThrown);
        });
    }
}

class UserPosts {
    constructor(el) {
        const post = new Post();
        el.on('click', 'span[data-target="post_delete"]', post.deletePost);
        el.on('click', 'span[data-target="post_like"]', post.likePost.bind(post));
    }
}

class PostForm {
    constructor(el) {
        this.form = el;
        this.container = $('#id_post_container');
        this.imgPreview = el.find('#id_preview_img');
        el.on('submit', this.addPost.bind(this));
        el.find('#id_image').on('change', this.previewImage.bind(this));
    }

    _clearErrors(field) {
        const fieldError = field.next();

        if (fieldError.length) {
            fieldError.remove();
        }

        field.removeClass('border-red-500');
    }

    _showFormErrors(errors) {
        const keys = Object.keys(errors);

        for (const key of keys) {
            const field = this.form.find(`#id_${key}`);
            this._clearErrors(field);

            field.addClass('border-red-500');
            field.after(`
                <p id="id_${key}_error" class="text-red-500 text-xs mt-2">
                    ${errors[key][0]}
                </p>
            `);
        }
    }
    
    previewImage(e) {
        const self = e.target;
        
        if (self.files) {
            const filesize = self.files.length;
            
            for (let i = 0; i < filesize; i++) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.imgPreview.append(`
                        <div class="bg-cover bg-center rounded-lg h-24 w-24 mx-2 mb-4" 
                            style="background-image: url('${e.target.result}')">
                            <span class="rounded-full cursor-pointer h-8 w-8 float-right flex items-center 
                                justify-center bg-gray-800 text-white m-2">x</span>
                        </div>
                    `);
                }
                reader.readAsDataURL(self.files[i]);
            }
        }
    }

    addPost(e) {
        e.preventDefault();
        const $form = $(e.target);
    
        $.ajax({
            url: $form.attr('action'), 
            type: 'POST',             
            data: new FormData($form[0]),
            cache: false,
            contentType: false,
            processData: false,
            headers: {
                'X-CSRFToken': Cookies.get('csrftoken')
            },
        }).done(response => {
            this.imgPreview.html('');
            this._clearErrors(this.form.find('#id_content'));
            this.form.trigger('reset');
            const newPost = new Post(this.container);
            newPost.renderPost(response);
        })
        .fail((xhr, status, errorThrown) => {
            this._showFormErrors(xhr.responseJSON.errors);
        });
    }
}

const components = [
    {
        klass: PostForm,
        target: '#id_form_post'
    },
    {
        klass: Post,
        target: '#id_post_container'
    },
    {
        klass: User,
        target: '#id_user_detail'
    },
    {
        klass: UserPosts,
        target: '#id_user_posts'
    }

]

components.forEach(component => {
    if ($(component.target).length) {
        $(component.target).each(function(index) {
            new component.klass($(this), component.options)
        });
    }
});

// function httpGet(url) {
//     return new Promise(function (resolve, reject) {
//         var httpReq = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');

//         httpReq.onreadystatechange = function () {
//             var data;

//             if (httpReq.readyState == 4) {
//                 if (httpReq.status == 200) {
//                     data = httpReq.responseText;
//                     resolve(data);
//                 } else {
//                     reject(new Error(httpReq.statusText));
//                 }
//             }
//         }

//         httpReq.open('GET', url, true);
//         httpReq.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
//         httpReq.send();
//     });
// }

// function httpPost(url, data, csrf = Cookies.get('csrftoken')) {
//     return new Promise(function (resolve, reject) {
//         var httpReq = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");

//         httpReq.onreadystatechange = function () {
//             var data;

//             if (httpReq.readyState == 4) {
//                 if (httpReq.status == 200) {
//                     data = httpReq.responseText;
//                     resolve(data);
//                 } else {
//                     reject(JSON.parse(httpReq.responseText));
//                 }
//             }
//         }

//         httpReq.open('POST', url, true);
//         httpReq.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
//         httpReq.setRequestHeader('X-CSRFToken', csrf);
//         httpReq.send(data);
//     });
// }

// function httpDelete(url, csrf = Cookies.get('csrftoken')) {
//     return new Promise(function (resolve, reject) {
//         var httpReq = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');

//         httpReq.onreadystatechange = function () {
//             var data;

//             if (httpReq.readyState == 4) {
//                 if (httpReq.status == 200) {
//                     data = JSON.parse(httpReq.responseText);
//                     resolve(data);
//                 } else {
//                     reject(new Error(httpReq.statusText));
//                 }
//             }
//         }

//         httpReq.open('DELETE', url, true);
//         httpReq.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
//         httpReq.setRequestHeader('X-CSRFToken', csrf);
//         httpReq.send();
//     });
// } 
