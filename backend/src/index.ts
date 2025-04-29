import express, { Request, Response } from "express";
import puppeteer, { ElementHandle, Page } from "puppeteer";
import cors from "cors";
import path from "path";

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const imagesPath = path.join(__dirname, "..", "public", "images");
app.use("/images", express.static(imagesPath));

app.post("/publishVehicle", async (req: Request, res: Response) => {
  const { price, vehicleDescription } = req.body;
  console.log({ price, vehicleDescription });
  try {
    const screenshotNames = ["screenshotVehicleDataDetails.png", "screenshotVehiclePriceDetails.png", "screenshotVehicleDescription.png", "screenshotImages.png"];
    const screenshotPath1 = path.join(imagesPath, screenshotNames[0]);
    const screenshotPath2 = path.join(imagesPath, screenshotNames[1]);
    const screenshotPath3 = path.join(imagesPath, screenshotNames[2]);
    const screenshotPath4 = path.join(imagesPath, screenshotNames[3]);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto("https://admin.seminuevos.com/login", { waitUntil: "networkidle2" });

    await page.type("#email", "carloscharlie4td@hotmail.com", { delay: 100 });
    await page.type("#password", "PruebaTecnica1!", { delay: 100 });
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" });
    try {
      await page.goto("https://particulares.seminuevos.com/particulares/vehiculos/publicar/_/seleccionar-plan?reset=true", { waitUntil: "networkidle2" });
    } catch (err) {
      await page.goto("https://particulares.seminuevos.com/particulares/vehiculos/publicar/_/seleccionar-plan?reset=true", { waitUntil: "networkidle2" });
    }
    await page.click("button.m_77c9d27d:nth-of-type(1)");

    await page.waitForNavigation({ waitUntil: "networkidle2" });

    await selectInputValue(page, "Marca", "Acura");
    await selectInputValue(page, "Modelo", "ILX");
    await selectInputValue(page, "Año", "2018");
    await selectInputValue(page, "Subtipo", "Sedán");
    await selectInputValue(page, "Versión", "2.4 Tech At");
    await selectInputValue(page, "Color", "Negro");
    await changeInputValue(page, "Recorrido", "20000");
    await changeInputValueAndSelect(page, "Código Postal", "64715 - Monterrey");
    await selectInputValue(page, "Ciudad del vehículo", "Monterrey");
    await page.screenshot({ path: screenshotPath1 });

    await changeInputValue(page, "Precio", String(price));
    await page.click('input[name="negotiable"][value="2"]');

    await page.screenshot({ path: screenshotPath2 });

    const buttons = await page.$$("button span span");
    for (const button of buttons) {
      const text = await button.evaluate((node) => node.textContent?.trim());
      if (text === "Siguiente") {
        const parentButton = (await button.evaluateHandle((node) => node.closest("button"))) as ElementHandle<HTMLSpanElement>;
        if (parentButton) {
          await parentButton.click();
          break;
        }
      }
    }

    await page.waitForNavigation({ waitUntil: "networkidle2" });

    await page.waitForSelector('p[data-placeholder="Descripción"]', { timeout: 5000 });
    await page.evaluate((vehicleDescriptionText) => {
      const pElement = document.querySelector('p[data-placeholder="Descripción"]');
      if (pElement) {
        pElement.innerHTML = vehicleDescriptionText;
        const event = new Event("input", { bubbles: true });
        pElement.dispatchEvent(event);
      }
    }, vehicleDescription);
    await page.screenshot({ path: screenshotPath3 });

    await page.waitForSelector('input[type="file"]');

    const filePaths = [screenshotPath1, screenshotPath2, screenshotPath3];
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.uploadFile(...filePaths);
    }

    await findImagesSectionForScreenshot(page);

    await delay(5000);

    await page.screenshot({ path: screenshotPath4 });

    await browser.close();
    res.send({ message: "Anuncio publicado con éxito.", imagesPaths: screenshotNames.map((name: string) => `http://localhost:5000/images/${name}`) });
  } catch (error) {
    console.log({ error });
    res.status(500).send({ error: "Error publicando el anuncio." });
  }
});

app.listen(port, () => {
  console.log(`Backend corriendo en http://localhost:${port}`);
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const selectInputValue = async (page: Page, inputToSearch: string, optionToChoose: string) => {
  try {
    await page.waitForSelector("div");
    const labels = await page.$$("label");

    for (const label of labels) {
      const labelText = await label.evaluate((node) => node.textContent?.trim());

      if (labelText === `${inputToSearch} *`) {
        const parentDiv = (await label.evaluateHandle((node: { parentElement: any }) => node.parentElement)) as ElementHandle;

        if (parentDiv) {
          const inputHandle = await parentDiv.$("div > input");
          if (inputHandle) {
            await inputHandle.click();
            await delay(500);

            const spans = await page.$$("span");

            for (const span of spans) {
              const spanText = await span.evaluate((node) => node.textContent?.trim());

              if (spanText === optionToChoose) {
                const spanParentDiv = (await span.evaluateHandle((node: { parentElement: any }) => node.parentElement)) as ElementHandle;
                if (spanParentDiv) {
                  await spanParentDiv.click();
                  break;
                } else {
                  console.log("No se encontró el div padre del span");
                }
              }
            }
            break;
          } else {
            console.log("No se encontró el input dentro del div hijo");
          }
        } else {
          console.log("No se encontró el div padre");
        }
      }
    }
  } catch (error) {
    console.error("Error al ejecutar la búsqueda:", error);
  }
};

const changeInputValue = async (page: Page, inputToSearch: string, valueToSet: string) => {
  try {
    await page.waitForSelector("div");
    const labels = await page.$$("label");

    for (const label of labels) {
      const labelText = await label.evaluate((node) => node.textContent?.trim());

      if (labelText === `${inputToSearch} *`) {
        const parentDiv = (await label.evaluateHandle((node: { parentElement: any }) => node.parentElement)) as ElementHandle;

        if (parentDiv) {
          const inputHandle = await parentDiv.$("div > input");
          if (inputHandle) {
            await inputHandle.click();

            await inputHandle.evaluate((input) => ((input as HTMLInputElement).value = ""));

            await inputHandle.type(valueToSet, { delay: 100 });

            break;
          } else {
            console.log("No se encontró el input dentro del div hijo");
          }
        } else {
          console.log("No se encontró el div padre");
        }
      }
    }
  } catch (error) {
    console.error("Error al ejecutar la búsqueda:", error);
  }
};

const findImagesSectionForScreenshot = async (page: Page) => {
  try {
    const pTexts = await page.$$("p");

    for (const pText of pTexts) {
      const text = await pText.evaluate((node) => node.textContent?.trim());

      if (text === "Imágenes *") {
        await page.evaluate((element) => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }, pText);

        return;
      }
    }

    console.log("No se encontró el texto 'Imágenes' en ningún <p>.");
  } catch (error) {
    console.error("Error al buscar la sección de imágenes:", error);
  }
};

const changeInputValueAndSelect = async (page: Page, inputToSearch: string, valueToSet: string) => {
  try {
    await page.waitForSelector("div");
    const labels = await page.$$("label");

    for (const label of labels) {
      const labelText = await label.evaluate((node) => node.textContent?.trim());

      if (labelText === `${inputToSearch} *`) {
        const parentDiv = (await label.evaluateHandle((node: { parentElement: any }) => node.parentElement)) as ElementHandle;

        if (parentDiv) {
          const inputHandle = await parentDiv.$("div > input");
          if (inputHandle) {
            await inputHandle.click();

            await inputHandle.evaluate((input) => ((input as HTMLInputElement).value = ""));

            await inputHandle.type(valueToSet, { delay: 100 });

            await delay(500);

            const spans = await page.$$("span");

            for (const span of spans) {
              const spanText = await span.evaluate((node) => node.textContent?.trim());

              if (spanText === valueToSet) {
                const spanParentDiv = (await span.evaluateHandle((node: { parentElement: any }) => node.parentElement)) as ElementHandle;
                if (spanParentDiv) {
                  await spanParentDiv.click();
                  break;
                } else {
                  console.log("No se encontró el div padre del span");
                }
              }
            }
            break;
          } else {
            console.log("No se encontró el input dentro del div hijo");
          }
        } else {
          console.log("No se encontró el div padre");
        }
      }
    }
  } catch (error) {
    console.error("Error al ejecutar la búsqueda:", error);
  }
};
