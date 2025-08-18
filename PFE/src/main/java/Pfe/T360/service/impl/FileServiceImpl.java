package Pfe.T360.service.impl;



import Pfe.T360.entity.File;
import Pfe.T360.repository.FileRepository;
import Pfe.T360.service.FileService;
import Pfe.T360.util.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Optional;
import java.io.InputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;

import java.io.InputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;


@Service
public class FileServiceImpl implements FileService {

    @Autowired
    private FileRepository repository;

    public String uploadFile(MultipartFile file) throws IOException {

        File fileData = repository.save(File.builder()
                .name(file.getOriginalFilename())
                .type(file.getContentType())
                .fileData(FileUtils.compressFile(file.getBytes())).build());
        if (fileData != null) {
            return "file uploaded successfully : " + file.getOriginalFilename();
        }
        return null;
    }

    public byte[] downloadFile(String fileName){
        Optional<File> dbImageData = repository.findByName(fileName);
        byte[] images=FileUtils.decompressFile(dbImageData.get().getFileData());
        return images;
    }
    @Override
    public String extractText(byte[] fileBytes, String fileName) {
        try (InputStream input = new ByteArrayInputStream(fileBytes)) {
            if (fileName.endsWith(".pdf")) {
                try (PDDocument document = PDDocument.load(input)) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    return stripper.getText(document);
                }
            } else if (fileName.endsWith(".docx")) {
                try (XWPFDocument doc = new XWPFDocument(input)) {
                    XWPFWordExtractor extractor = new XWPFWordExtractor(doc);
                    return extractor.getText();
                }
            } else if (fileName.endsWith(".doc")) {
                try (HWPFDocument doc = new HWPFDocument(input)) {
                    WordExtractor extractor = new WordExtractor(doc);
                    return extractor.getText();
                }
            } else {
                throw new IllegalArgumentException("Format de fichier non pris en charge.");
            }
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'extraction du texte", e);
        }
    }
}