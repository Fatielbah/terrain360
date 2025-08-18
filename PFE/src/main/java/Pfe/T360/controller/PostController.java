package Pfe.T360.controller;

import Pfe.T360.entity.Post;
import Pfe.T360.dto.PostDTO;
import Pfe.T360.entity.File;
import Pfe.T360.util.FileUtils;
import jakarta.validation.Valid;
import Pfe.T360.repository.FileRepository;
import Pfe.T360.service.PostService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "http://localhost:3000")
public class PostController {

    private final PostService postService;
    private final FileRepository fileRepository;
    @Autowired
    public PostController(PostService postService,FileRepository fileRepository) {
        this.postService = postService;
        this.fileRepository= fileRepository;
    }

    
    @GetMapping
    public List<PostDTO> getAllPosts() {
        return postService.getAllPosts();  // List<PostDTO> déjà mappée dans le service
    }


    @GetMapping("/{id}")
    public Post getPostById(@PathVariable Long id) {
        return postService.getPostById(id);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostDTO> createPost(
        @RequestPart PostDTO postDTO,
        @RequestPart(required = false) List<MultipartFile> medias) {
        
        try {
            PostDTO createdPost = postService.createPost(postDTO, medias);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdPost);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    @PutMapping("/{id}")
    public ResponseEntity<PostDTO> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody PostDTO updateDTO) {
        
        PostDTO updatedPost = postService.updatePost(id, updateDTO);
        return ResponseEntity.ok(updatedPost);
    }

    @DeleteMapping("/{id}")
    public void deletePost(@PathVariable Long id) {
        postService.deletePost(id);
    }
    @GetMapping("/api/files/{id}")
    public ResponseEntity<byte[]> getFile(@PathVariable Long id) {
        File file = fileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fichier non trouvé"));

        byte[] decompressedData = FileUtils.decompressFile(file.getFileData());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(file.getType()));

        // 👇 Disposition selon le type : inline (affiche PDF) ou attachment (force téléchargement)
        String disposition = file.getType() != null && file.getType().equals("application/pdf")
                ? "inline"
                : "attachment";

        headers.set(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + file.getName() + "\"");

        return new ResponseEntity<>(decompressedData, headers, HttpStatus.OK);
    }


}
