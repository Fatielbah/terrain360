package Pfe.T360.service;


import Pfe.T360.dto.PostDTO;
import Pfe.T360.entity.Post;
import java.io.IOException;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

public interface PostService {
    List<PostDTO> getAllPosts();
    Post getPostById(Long id);
    PostDTO createPost(PostDTO postDTO, List<MultipartFile> medias)throws IOException;
    PostDTO updatePost(Long id, PostDTO postUpdateDTO);
    void deletePost(Long id);
}
