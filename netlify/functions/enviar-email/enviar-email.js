const nodemailer = require("nodemailer");

exports.handler = async (event, context) => {
  try {
    // Só permite método POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: "Método não permitido"
      };
    }

    // Ler o JSON enviado pelo front-end
    let data;
    try {
      data = JSON.parse(event.body || "{}");
    } catch (e) {
      console.error("Erro ao fazer parse do JSON:", e);
      return {
        statusCode: 400,
        body: "Erro: JSON inválido enviado pela requisição."
      };
    }

    // Extrair dados recebidos do front
    const csv          = data.csv;
    const xlsxBase64   = data.xlsx || null;
    const escola       = data.escola || "Escola não informada";
    const turma        = data.turma || "Todas as turmas";
    const nome         = data.nome  || "Nome não informada";
    const filenameCsv  = data.filename || "acompanhamento.csv";
    const xlsxFilename = data.xlsxFilename || "acompanhamento.xlsx";

    if (!csv) {
      return {
        statusCode: 400,
        body: "Erro: CSV não recebido."
      };
    }

    // Criar o transporte SMTP usando Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Assunto do e-mail
    const subject = `Acompanhamento - ${escola} - ${turma} - ${nome}`;

    // Montar anexos
    const attachments = [
      {
        filename: filenameCsv,
        content: csv
      }
    ];

    if (xlsxBase64) {
      attachments.push({
        filename: xlsxFilename,
        content: Buffer.from(xlsxBase64, "base64"),
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
    }

    // Configuração do e-mail
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: [
        "raphaelcorrea@escola.pr.gov.br",
        "ellen.stein@escola.pr.gov.br"
      ],
      subject: subject,
      text:
        "Segue em anexo o arquivo de acompanhamento enviado pela página.\n\n" +
        `Escola: ${escola}\n` +
        `Turma: ${turma}\n` +
        `Responsável pelo envio: ${nome}\n`,
      attachments
    };

    // Enviar e-mail
    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: "Arquivos enviados com sucesso ao e-mail."
    };

  } catch (error) {
    console.error("Erro ao enviar o e-mail:", error);
    return {
      statusCode: 500,
      body: "Erro ao enviar o e-mail."
    };
  }
};
